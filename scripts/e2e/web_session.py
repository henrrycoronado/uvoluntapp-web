# Prueba de navegador de inicio de sesión, inicio y cierre de sesión. Requiere API en :5207, web en :5173 y DEV_ADMIN_1_* en el entorno.
import os
from playwright.sync_api import sync_playwright, expect
import sys
results=[]
def check(name, cond):
    results.append(bool(cond)); print("PASS" if cond else "FAIL", name)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto("http://localhost:5173/acceso")
    expect(page.get_by_role("heading", name="Iniciar sesión")).to_be_visible(timeout=10000)
    check("pantalla de login visible", True)
    page.get_by_label("Correo").fill(os.environ["DEV_ADMIN_1_EMAIL"])
    page.get_by_label("Contraseña").fill(os.environ["DEV_ADMIN_1_PASSWORD"])
    page.get_by_role("button", name="Entrar").click()
    expect(page.get_by_role("heading", name="Admin1 Prueba")).to_be_visible(timeout=15000)
    check("redirige al perfil con los datos del administrador", True)
    check("muestra el correo de acceso", page.get_by_text(os.environ["DEV_ADMIN_1_EMAIL"]).is_visible())
    check("muestra el rol de administrador", page.get_by_text("Administrador · Global").is_visible())
    page.screenshot(path="/tmp/claude-1000/api/profile.png", full_page=True)
    page.get_by_role("button", name="Cerrar sesión").click()
    expect(page.get_by_role("heading", name="Iniciar sesión")).to_be_visible(timeout=10000)
    check("cerrar sesión vuelve al login", True)
    page.goto("http://localhost:5173/perfil")
    expect(page.get_by_role("heading", name="Iniciar sesión")).to_be_visible(timeout=10000)
    check("perfil sin sesión redirige al login", True)
    page.goto("http://localhost:5173/acceso")
    page.get_by_label("Correo").fill(os.environ["DEV_ADMIN_1_EMAIL"])
    page.get_by_label("Contraseña").fill("clave-mala")
    page.get_by_role("button", name="Entrar").click()
    expect(page.get_by_role("alert")).to_have_text("Correo o contraseña incorrectos.", timeout=10000)
    check("credenciales incorrectas muestran error", True)
    browser.close()
print(f"RESULTADO web: {sum(results)}/{len(results)}")
sys.exit(0 if all(results) else 1)
