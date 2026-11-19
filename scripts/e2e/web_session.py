# Prueba de navegador: landing, acceso, espacio general, perfil y cierre de sesión.
# Requiere API en :5207, web en :5173 y DEV_ADMIN_1_* en el entorno.
import os
import sys
from playwright.sync_api import expect, sync_playwright

WEB = "http://localhost:5173"
results = []


def check(name, cond):
    results.append(bool(cond))
    print("PASS" if cond else "FAIL", name)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto(WEB + "/")
    expect(page.get_by_role("button", name="Empezar")).to_be_visible(timeout=10000)
    check("landing pública con botón Empezar", True)
    page.get_by_role("button", name="Empezar").click()
    expect(page.get_by_role("heading", name="Iniciar sesión")).to_be_visible(timeout=10000)
    check("Empezar sin sesión lleva al acceso", True)
    page.get_by_label("Correo").fill(os.environ["DEV_ADMIN_1_EMAIL"])
    page.get_by_label("Contraseña").fill(os.environ["DEV_ADMIN_1_PASSWORD"])
    page.get_by_role("button", name="Entrar").click()
    expect(page.get_by_text("Hola, Admin1.")).to_be_visible(timeout=15000)
    check("entra al espacio general", True)
    check("sin barra superior", page.locator("header").count() == 0)
    page.get_by_role("button", name="Perfil").click()
    expect(page.get_by_role("heading", name="Mis datos")).to_be_visible(timeout=10000)
    check("perfil desde la barra lateral", True)
    page.get_by_role("button", name="Cerrar sesión").click()
    expect(page.get_by_role("heading", name="Iniciar sesión")).to_be_visible(timeout=10000)
    check("cerrar sesión desde el perfil", True)
    page.goto(WEB + "/inicio")
    expect(page.get_by_role("heading", name="Iniciar sesión")).to_be_visible(timeout=10000)
    check("espacio general sin sesión redirige al acceso", True)
    page.get_by_label("Correo").fill(os.environ["DEV_ADMIN_1_EMAIL"])
    page.get_by_label("Contraseña").fill("clave-incorrecta")
    page.get_by_role("button", name="Entrar").click()
    expect(page.get_by_role("alert")).to_have_text("Correo o contraseña incorrectos.", timeout=10000)
    check("credenciales incorrectas muestran error", True)
    browser.close()

print(f"RESULTADO sesión web: {sum(results)}/{len(results)}")
sys.exit(0 if all(results) else 1)
