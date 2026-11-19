# Prueba de navegador (Playwright + Chrome) de las vistas por rol. Requiere API en :5207, web en :5173, Mailpit en :8025 y DEV_ADMIN_1_* en el entorno.
import json, os, re, sys, uuid, urllib.request
from playwright.sync_api import sync_playwright, expect
API = "http://localhost:5207"; MAIL = "http://localhost:8025"; WEB = "http://localhost:5173"
results = []
def check(name, cond, extra=""):
    results.append(bool(cond)); print("PASS" if cond else "FAIL", name, extra)
def api(method, path, body=None, token=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None, method=method)
    req.add_header("Content-Type", "application/json")
    if token: req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req, timeout=20) as r: return json.loads(r.read().decode() or "{}")
def code_for(email):
    for m in json.loads(urllib.request.urlopen(MAIL + "/api/v1/messages").read())["messages"]:
        if any(t["Address"].lower() == email.lower() for t in m["To"]):
            text = json.loads(urllib.request.urlopen(f"{MAIL}/api/v1/message/{m['ID']}").read())["Text"]
            f = re.findall(r"\b(\d{6})\b", text)
            if f: return f[0]
PWD = "Web#2026xyzA"
def new_user(first):
    email = f"{first.lower()}.{uuid.uuid4().hex[:6]}@ucb.edu.bo"
    api("POST", "/api/v1/auth/register", {"email": email, "firstName": first, "lastName": "Web", "password": PWD})
    api("POST", "/api/v1/auth/verify-otp", {"email": email, "code": code_for(email)})
    return email
leader_email = new_user("Lucia"); op_email = new_user("Mateo"); vol_email = new_user("Sara")
ADMIN_EMAIL, ADMIN_PWD = os.environ["DEV_ADMIN_1_EMAIL"], os.environ["DEV_ADMIN_1_PASSWORD"]

def login(page, email, pwd):
    page.goto(WEB + "/acceso")
    page.get_by_label("Correo").fill(email); page.get_by_label("Contraseña").fill(pwd)
    page.get_by_role("button", name="Entrar").click()
    expect(page.get_by_role("heading", name="Voluntariado de la Pastoral Universitaria UCB")).to_be_visible(timeout=15000)
def logout(page):
    page.get_by_role("button", name="Cerrar sesión").click()
    expect(page.get_by_role("heading", name="Iniciar sesión")).to_be_visible(timeout=10000)
def assign(page, person, role, program):
    form = page.get_by_role("form", name="Asignar rol")
    form.get_by_label("Persona", exact=True).select_option(label=person)
    form.get_by_label("Rol", exact=True).select_option(label=role)
    form.get_by_label("Programa", exact=True).select_option(label=program)
    form.get_by_role("button", name="Asignar").click()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1366, "height": 900})

    # ADMIN
    login(page, ADMIN_EMAIL, ADMIN_PWD)
    check("admin ve el botón de consola", page.get_by_role("button", name="Consola Uvoluntapp").is_visible())
    page.get_by_role("button", name="Tema claro").click()
    check("cambia a tema claro", page.evaluate("document.documentElement.dataset.theme") == "light")
    page.get_by_role("button", name="Tema oscuro").click()
    page.get_by_role("button", name="Consola Uvoluntapp").click()
    nav = page.get_by_role("navigation", name="Secciones de la consola")
    expect(nav).to_be_visible(timeout=10000)
    for s in ["Usuarios", "Aprobación de cuentas", "Roles y permisos", "Administradores", "Auditoría", "Programas", "Financiero"]:
        check(f"admin ve la sección {s}", nav.get_by_role("button", name=s, exact=True).is_visible())
    nav.get_by_role("button", name="Roles y permisos").click()
    expect(page.get_by_role("form", name="Asignar rol")).to_be_visible(timeout=10000)
    page.wait_for_timeout(800)
    lucia = page.get_by_role("form", name="Asignar rol").get_by_label("Persona", exact=True).locator("option", has_text=leader_email).inner_text()
    assign(page, lucia, "Líder de programa", "Voluntariado comunitario")
    expect(page.get_by_role("status")).to_have_text("Rol asignado.", timeout=10000)
    check("admin asigna líder de programa desde la web", True)
    page.screenshot(path="/tmp/claude-1000/api/console_admin.png", full_page=True)
    logout(page)

    # LÍDER DE PROGRAMA
    login(page, leader_email, PWD)
    check("líder ve el botón de consola", page.get_by_role("button", name="Consola Uvoluntapp").is_visible())
    page.get_by_role("button", name="Consola Uvoluntapp").click()
    nav = page.get_by_role("navigation", name="Secciones de la consola")
    expect(nav).to_be_visible(timeout=10000)
    check("líder NO ve aprobación de cuentas", nav.get_by_role("button", name="Aprobación de cuentas", exact=True).count() == 0)
    check("líder NO ve administradores", nav.get_by_role("button", name="Administradores", exact=True).count() == 0)
    check("líder ve reportes e IA", nav.get_by_role("button", name="Reportes e IA").is_visible())
    nav.get_by_role("button", name="Roles y permisos").click()
    form = page.get_by_role("form", name="Asignar rol")
    expect(form).to_be_visible(timeout=10000)
    page.wait_for_timeout(800)
    roles = form.get_by_label("Rol", exact=True).locator("option").all_inner_texts()
    check("líder solo puede dar líder operativo", roles == ["Líder operativo"], str(roles))
    programs = form.get_by_label("Programa", exact=True).locator("option").all_inner_texts()
    check("líder solo ve sus programas", programs == ["Elige un programa", "Voluntariado comunitario"], str(programs))
    mateo = form.get_by_label("Persona", exact=True).locator("option", has_text=op_email).inner_text()
    assign(page, mateo, "Líder operativo", "Voluntariado comunitario")
    expect(page.get_by_role("status")).to_have_text("Rol asignado.", timeout=10000)
    check("líder asigna líder operativo desde la web", True)
    logout(page)

    # VOLUNTARIO
    login(page, vol_email, PWD)
    check("voluntario NO ve la consola", page.get_by_role("button", name="Consola Uvoluntapp").count() == 0)
    expect(page.get_by_role("heading", name="Voluntariado comunitario")).to_be_visible(timeout=10000)
    check("voluntario ve programas activos", True)
    check("voluntario NO ve programas en borrador", page.get_by_role("heading", name="Programa de prueba").count() == 0)
    check("voluntario ve su sección de registros", page.get_by_role("heading", name="Mis registros").is_visible())
    page.get_by_label("Teléfono").fill("70011223")
    page.get_by_role("button", name="Guardar cambios").click()
    expect(page.get_by_role("status")).to_have_text("Datos actualizados.", timeout=10000)
    check("voluntario edita su perfil", True)
    page.screenshot(path="/tmp/claude-1000/api/home_volunteer.png", full_page=True)
    page.goto(WEB + "/consola")
    expect(page.get_by_role("heading", name="Acceso denegado")).to_be_visible(timeout=10000)
    check("voluntario recibe acceso denegado en /consola", True)
    logout(page)
    browser.close()
print(f"RESULTADO roles web: {sum(results)}/{len(results)}"); sys.exit(0 if all(results) else 1)
