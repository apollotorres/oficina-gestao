from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import re
import cloudscraper
from bs4 import BeautifulSoup

ACRONYMS = {
    'BMW', 'GTI', 'TSI', 'TFSI', 'AMG', 'RS3', 'RS4', 'RS5', 'RS6', 'RS',
    'TS', 'HD', '4MATIC', 'PDK', 'DSG', 'V8', 'V6', 'V10', 'V12', 'GLI', 'M', 'VW',
    'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TTS', 'TT', 'STI', 'WRX', 'GT3', 'GT4', 'GTS', 'GT',
    '16V', '8V', '24V', '12V', '4X4', '4WD', 'AWD', 'FWD', 'RWD', 'CVT', 'THP', 'MPI', 'VVT', 'GDI', 'FSI',
    'EXP', 'LT', 'LTZ', 'SLX', 'GLX', 'GLS', 'EXL', 'LXR', 'XEI', 'SE', 'SEL', 'XR', 'GII', 'GIII', 'GIV', 'GV', 'GVI', 'GVII', 'GVIII',
    'HR-V', 'CR-V', 'WR-V', 'RAV4', 'SW4', 'SI', 'GT-R'
}

def format_automotive_title(s: str) -> str:
    if not s:
        return ''
    cleaned = s.strip()
    cleaned = re.sub(r'^(I/|IMP/|NAC/)', '', cleaned, flags=re.IGNORECASE)
    if '/' in cleaned and ' / ' not in cleaned:
        parts = cleaned.split('/')
        if len(parts) == 2 and parts[1].strip():
            cleaned = parts[1].strip()

    cleaned = re.sub(
        r'\b([1-9])([0-9])([0-9]{1,2}V)\b',
        lambda m: f"{m.group(1)}.{m.group(2)} {m.group(3).upper()}",
        cleaned,
        flags=re.IGNORECASE
    )
    cleaned = re.sub(
        r'\b([1-9])([0-9])(TSI|TFSI|TURBO|THP|MPI|VVT|GDI|FSI|T)\b',
        lambda m: f"{m.group(1)}.{m.group(2)} {'Turbo' if m.group(3).upper() == 'T' else m.group(3).upper()}",
        cleaned,
        flags=re.IGNORECASE
    )
    cleaned = re.sub(
        r'\b(EXP|LT|LTZ|ATTRACTIVE|ATTRACTIV|DYNAMIC|ACTIVE|INTENSE|AUTHENTIQUE|TREND|CONFORT|COMFORTLINE|HIGHLINE|SPORTLINE|TITANIUM|SEL|SE|XR|XL|XLS|GL|GLS|GLX|LX|EX|EXL|LXR|PREMIUM|DRIVE|LIKE|TREKKING|WAY|PRECISION|ENDURANCE|FREEDOM|VOLCANO|XEI|ALTIS|GR|PLUS|SPECIAL)\s+(10|12|13|14|15|16|18|20|24|25|28|30|32|35|36|38|40)\b',
        lambda m: f"{m.group(1)} {m.group(2)[0]}.{m.group(2)[1]}",
        cleaned,
        flags=re.IGNORECASE
    )

    words = [w for w in cleaned.split(' ') if w]
    out = []
    for w in words:
        upper = w.upper()
        if upper in ACRONYMS or re.match(r'^[0-9]+(\.[0-9]+)?$', w):
            out.append(upper)
        elif '-' in w:
            out.append('-'.join(p.capitalize() for p in w.split('-')))
        else:
            out.append(w.capitalize())
    return ' '.join(out)

def fetch_plate(plate: str):
    scraper = cloudscraper.create_scraper(
        browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True}
    )
    url = f"https://www.keplaca.com/placa?placa-fipe={plate}"
    response = scraper.get(url, timeout=12)
    if response.status_code != 200:
        return {"error": f"HTTP {response.status_code}"}

    soup = BeautifulSoup(response.text, 'html.parser')
    data = {}
    table = soup.find('table', class_='fipeTablePriceDetail')
    if table:
        for row in table.find_all('tr'):
            cols = row.find_all('td')
            if len(cols) >= 2:
                key = cols[0].text.strip().replace(':', '').lower()
                val = cols[1].text.strip()
                data[key] = val

    brand = format_automotive_title(data.get('marca', ''))
    model = format_automotive_title(data.get('modelo', ''))
    year = data.get('ano', data.get('ano modelo', ''))
    color = format_automotive_title(data.get('cor', ''))

    if not brand and not model:
        return {"error": "not_found", "message": "Dados não encontrados para esta placa."}

    return {
        "success": True,
        "placa": plate,
        "marca": brand,
        "modelo": model,
        "ano": year,
        "cor": color
    }

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        plate = ''
        if 'placa' in qs and qs['placa']:
            plate = qs['placa'][0]
        else:
            parts = [p for p in parsed.path.split('/') if p]
            if parts:
                plate = parts[-1]

        clean_plate = re.sub(r'[^a-zA-Z0-9]', '', plate).upper()
        if len(clean_plate) < 7:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Placa deve ter 7 caracteres válidos"}).encode('utf-8'))
            return

        try:
            result = fetch_plate(clean_plate)
            status = 404 if result.get('error') else 200
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
