import sys
import json
import re
import cloudscraper
import urllib.request
from bs4 import BeautifulSoup

def create_scraper():
    return cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'desktop': True
        }
    )

def parse_table_data(html):
    soup = BeautifulSoup(html, 'html.parser')
    data = {}
    for tr in soup.find_all('tr'):
        tds = tr.find_all(['td', 'th'])
        if len(tds) >= 2:
            k = tds[0].get_text(strip=True).replace(':', '').lower()
            v = tds[1].get_text(strip=True)
            if k and v and v != '****':
                data[k] = v
    return data

def fetch_tabelafipebrasil(plate, scraper):
    try:
        url = f"https://www.tabelafipebrasil.com/placa/{plate}"
        res = scraper.get(url, timeout=7)
        if res.status_code == 200 and "Attention Required!" not in res.text:
            data = parse_table_data(res.text)
            brand = data.get('marca')
            model = data.get('modelo')
            if brand or model:
                year_str = data.get('ano modelo') or data.get('ano') or ''
                year_clean = re.sub(r'\D', '', year_str)[:4]
                return {
                    "source": "tabelafipebrasil",
                    "plate": plate,
                    "brand": brand.title() if brand else "",
                    "model": model if model else "",
                    "year": year_clean,
                    "color": (data.get('cor') or '').title(),
                    "fuel": data.get('combustível') or data.get('combustivel', ''),
                    "city": (data.get('municipio') or data.get('município') or '').title(),
                    "uf": (data.get('uf') or '').upper(),
                    "fipe_val": data.get('valor venal', '')
                }
    except Exception:
        pass
    return None

def fetch_keplaca(plate, scraper):
    try:
        url = f"https://www.keplaca.com/placa/{plate}"
        res = scraper.get(url, timeout=7)
        if res.status_code == 200 and "Attention Required!" not in res.text:
            data = parse_table_data(res.text)
            brand = data.get('marca') or data.get('fabricante')
            model = data.get('modelo')
            if brand or model:
                year_str = data.get('ano modelo') or data.get('ano') or ''
                year_clean = re.sub(r'\D', '', year_str)[:4]
                return {
                    "source": "keplaca",
                    "plate": plate,
                    "brand": brand.title() if brand else "",
                    "model": model if model else "",
                    "year": year_clean,
                    "color": (data.get('cor') or '').title(),
                    "fuel": data.get('combustível') or data.get('combustivel', ''),
                    "city": (data.get('município') or data.get('municipio') or data.get('cidade') or '').title(),
                    "uf": (data.get('uf') or data.get('estado') or '').upper(),
                    "fipe_val": data.get('valor venal', '')
                }
    except Exception:
        pass
    return None

def fetch_urllib_fallback(plate):
    try:
        url = f"https://www.keplaca.com/placa/{plate}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        })
        with urllib.request.urlopen(req, timeout=6) as response:
            html = response.read().decode('utf-8', errors='ignore')
            desc_match = re.search(r'"description":\s*"([^"]+)"', html)
            description = desc_match.group(1) if desc_match else ""
            
            def get_field(pattern):
                m = re.search(pattern, html, re.IGNORECASE)
                return m.group(1).strip() if m else ""

            brand = get_field(r'Marca:?\s*</td>\s*<td>\s*<b>([^<]+)</b>') or get_field(r'Marca:?\s*</th>\s*<td>([^<]+)')
            model = get_field(r'Modelo:?\s*</td>\s*<td>\s*<b>([^<]+)</b>') or get_field(r'Modelo:?\s*</th>\s*<td>([^<]+)')
            year = get_field(r'Ano Modelo:?\s*</td>\s*<td>\s*<b>([^<]+)</b>') or get_field(r'Ano:?\s*</td>\s*<td>\s*<b>([^<]+)</b>')
            color = get_field(r'Cor:?\s*</td>\s*<td>\s*<b>([^<]+)</b>')
            fuel = get_field(r'Combust[íi]vel:?\s*</td>\s*<td>\s*<b>([^<]+)</b>')
            uf = get_field(r'UF:?\s*</td>\s*<td>\s*<b>([^<]+)</b>')
            city = get_field(r'Munic[íi]pio:?\s*</td>\s*<td>\s*<b>([^<]+)</b>')

            if (not brand or not model) and "corresponde a" in description:
                m_desc = re.search(r'corresponde a (?:carro|ve[íi]culo)?\s*([A-Z0-9\-\s]+?)\s+(\d{4})\s+de cor\s+([A-Za-z]+)\s+registrado em\s+([^(\n]+)\s*\(([^)]+)\)', description, re.IGNORECASE)
                if m_desc:
                    full_name = m_desc.group(1).strip()
                    parts = full_name.split(' ', 1)
                    brand = parts[0]
                    model = parts[1] if len(parts) > 1 else full_name
                    year = m_desc.group(2)
                    color = m_desc.group(3)
                    city = m_desc.group(4).strip()
                    uf = m_desc.group(5).strip()

            if brand or model:
                return {
                    "source": "keplaca_urllib",
                    "plate": plate,
                    "brand": brand,
                    "model": model,
                    "year": year,
                    "color": color,
                    "fuel": fuel,
                    "city": city,
                    "uf": uf,
                    "description": description
                }
    except Exception:
        pass
    return None

def lookup_all(plate):
    cleaned = re.sub(r'[^A-Z0-9]', '', plate.upper())
    scraper = create_scraper()
    
    # 1. TabelaFipeBrasil (cloudscraper + bs4)
    res = fetch_tabelafipebrasil(cleaned, scraper)
    if res:
        return res
        
    # 2. KePlaca (cloudscraper + bs4)
    res = fetch_keplaca(cleaned, scraper)
    if res:
        return res

    # 3. KePlaca (urllib fallback)
    res = fetch_urllib_fallback(cleaned)
    if res:
        return res

    return {"error": "Nenhum portal retornou dados para a placa informada."}

if __name__ == '__main__':
    plate_arg = sys.argv[1] if len(sys.argv) > 1 else "RJW9G02"
    result = lookup_all(plate_arg)
    print(json.dumps(result, ensure_ascii=False))

