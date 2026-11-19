# Prueba de navegador de las vistas por rol con los usuarios de prueba sembrados en Development.
# Requiere API en :5207, web en :5173, Mailpit en :8025, DEV_ADMIN_1_* y DEV_USERS_PASSWORD en el entorno.
import json
import os
import re
import sys
import urllib.request
import uuid
from playwright.sync_api import expect, sync_playwright

API, MAIL, WEB = "http://localhost:5207", "http://localhost:8025", "http://localhost:5173"
PWD = os.environ["DEV_USERS_PASSWORD"]
results = []


def check(name, cond, extra=""):
    results.append(bool(cond))
    print("PASS" if cond else "FAIL", name, extra)


def api(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None, method=method)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or "{}")


def code_for(email):
    for m in json.loads(urllib.request.urlopen(MAIL + "/api/v1/messages").read())["messages"]:
        if any(t["Address"].lower() == email.lower() for t in m["To"]):
            text = json.loads(urllib.request.urlopen(f"{MAIL}/api/v1/message/{m['ID']}").read())["Text"]
            found = re.findall(r"\b(\d{6})\b", text)
            if found:
                return found[0]


def new_volunteer(first):
    email = f"{first.lower()}.{uuid.uuid4().hex[:6]}@ucb.edu.bo"
    api("POST", "/api/v1/auth/register", {"email": email, "firstName": first, "lastName": "Web", "password": PWD})
    api("POST", "/api/v1/auth/verify-otp", {"email": email, "code": code_for(email)})
    return email


def login(page, email, password=PWD):
    page.goto(WEB + "/acceso")
    page.get_by_label("Correo").fill(email)
    page.get_by_label("Contraseña").fill(password)
    page.get_by_role("button", name="Entrar").click()
    expect(page.get_by_role("heading", name="Voluntariado de la Pastoral Universitaria UCB")).to_be_visible(timeout=15000)


def logout(page):
    page.get_by_role("button", name="Perfil", exact=True).click()
    page.get_by_role("button", name="Cerrar sesión").click()
    expect(page.get_by_role("heading", name="Iniciar sesión")).to_be_visible(timeout=10000)


def open_console(page):
    page.get_by_role("button", name="Consola Uvoluntapp").click()
    nav = page.get_by_role("navigation", name="Secciones de consola")
    expect(nav).to_be_visible(timeout=10000)
    return nav


def assign(page, email, role, program):
    form = page.get_by_role("form", name="Asignar rol")
    page.wait_for_timeout(600)
    form.get_by_label("Persona", exact=True).select_option(label=form.get_by_label("Persona", exact=True).locator("option", has_text=email).inner_text())
    form.get_by_label("Rol", exact=True).select_option(label=role)
    form.get_by_label("Programa", exact=True).select_option(label=program)
    form.get_by_role("button", name="Asignar").click()
    expect(page.get_by_role("status")).to_have_text("Rol asignado.", timeout=10000)


target_pl, target_ol = new_volunteer("Lucia"), new_volunteer("Mateo")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1366, "height": 800})

    # ADMIN
    login(page, os.environ["DEV_ADMIN_1_EMAIL"], os.environ["DEV_ADMIN_1_PASSWORD"])
    page.get_by_role("button", name="Perfil", exact=True).click()
    page.get_by_role("button", name="Claro").click()
    check("tema claro desde el perfil", page.evaluate("document.documentElement.dataset.theme") == "light")
    page.get_by_role("button", name="Oscuro").click()
    nav = open_console(page)
    for s in ["Usuarios", "Aprobación de cuentas", "Roles y permisos", "Administradores", "Auditoría", "Programas", "Financiero"]:
        check(f"admin ve {s}", nav.get_by_role("button", name=s, exact=True).is_visible())
    check("la consola tiene Perfil en la barra lateral", page.get_by_role("button", name="Perfil", exact=True).is_visible())
    check("la consola agrupa por features", page.get_by_text("Personas y accesos").is_visible() and page.get_by_text("Participación").is_visible())
    check("la consola ya no muestra la etiqueta de permiso", page.get_by_text("Puedes gestionar").count() == 0)
    expect(page.get_by_text("Cuentas externas por revisar")).to_be_visible(timeout=10000)
    check("el resumen muestra cifras del admin", True)
    nav.get_by_role("button", name="Roles y permisos", exact=True).click()
    assign(page, target_pl, "Líder de programa", "Voluntariado comunitario")
    check("admin asigna líder de programa", True)
    page.mouse.wheel(0, 4000)
    page.wait_for_timeout(400)
    top = page.evaluate("document.querySelector('aside').getBoundingClientRect().top")
    check("la barra lateral queda fija al desplazar", abs(top) < 1, f"top={top}")
    logout(page)

    # LÍDER DE PROGRAMA (sembrado)
    login(page, "lider.programa@uvoluntapp.test")
    nav = open_console(page)
    check("líder NO ve aprobación de cuentas", nav.get_by_role("button", name="Aprobación de cuentas", exact=True).count() == 0)
    check("líder NO ve administradores", nav.get_by_role("button", name="Administradores", exact=True).count() == 0)
    check("líder ve reportes e IA", nav.get_by_role("button", name="Reportes e IA", exact=True).is_visible())
    nav.get_by_role("button", name="Roles y permisos", exact=True).click()
    form = page.get_by_role("form", name="Asignar rol")
    expect(form).to_be_visible(timeout=10000)
    page.wait_for_timeout(600)
    check("líder solo da líder operativo", form.get_by_label("Rol", exact=True).locator("option").all_inner_texts() == ["Líder operativo"])
    programs = form.get_by_label("Programa", exact=True).locator("option").all_inner_texts()
    check("líder solo ve su programa", programs == ["Elige un programa", "Voluntariado comunitario"], str(programs))
    assign(page, target_ol, "Líder operativo", "Voluntariado comunitario")
    check("líder asigna líder operativo", True)
    logout(page)

    # LÍDER OPERATIVO (sembrado)
    login(page, "lider.operativo@uvoluntapp.test")
    nav = open_console(page)
    check("operativo ve registros", nav.get_by_role("button", name="Registros", exact=True).is_visible())
    check("operativo NO ve reportes e IA", nav.get_by_role("button", name="Reportes e IA", exact=True).count() == 0)
    nav.get_by_role("button", name="Usuarios", exact=True).click()
    expect(page.get_by_role("columnheader", name="Correo")).to_be_visible(timeout=10000)
    check("operativo revisa usuarios sin acciones", page.get_by_role("button", name="Dar de baja").count() == 0 and page.get_by_role("columnheader", name="Acciones").count() == 0)
    nav.get_by_role("button", name="Programas", exact=True).click()
    expect(page.get_by_role("heading", name="Programas donde apoyas como líder operativo")).to_be_visible(timeout=10000)
    check("operativo ve sus programas y el resto solo de consulta", page.get_by_role("heading", name="Otros programas · solo consulta").is_visible())
    logout(page)

    # LÍDER SIN PROGRAMA (sembrado)
    login(page, "lider.sinprograma@uvoluntapp.test")
    nav = open_console(page)
    nav.get_by_role("button", name="Roles y permisos", exact=True).click()
    expect(page.get_by_text("todavía no tienes programas asignados")).to_be_visible(timeout=10000)
    check("líder sin programa ve un mensaje claro", True)
    logout(page)

    # VOLUNTARIO (sembrado)
    login(page, "voluntario@uvoluntapp.test")
    check("voluntario NO ve la consola", page.get_by_role("button", name="Consola Uvoluntapp").count() == 0)
    page.get_by_role("button", name="Programas", exact=True).click()
    expect(page.get_by_role("heading", name="Voluntariado comunitario")).to_be_visible(timeout=10000)
    check("voluntario ve programas activos", True)
    check("voluntario NO ve borradores", page.get_by_role("heading", name="Programa de prueba").count() == 0)
    page.get_by_role("button", name="Mis registros").click()
    check("voluntario ve sus registros vacíos", page.get_by_role("heading", name="Inscripciones").is_visible())
    page.goto(WEB + "/consola")
    expect(page.get_by_role("heading", name="Acceso denegado")).to_be_visible(timeout=10000)
    check("voluntario recibe acceso denegado en la consola", True)
    browser.close()

print(f"RESULTADO roles web: {sum(results)}/{len(results)}")
sys.exit(0 if all(results) else 1)
