console.log("Microfrontend AUTH cargado");

// Esperar a que el HTML esté listo
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    const errorMsg = document.getElementById("error-message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user = document.getElementById("user").value;
        const pass = document.getElementById("pass").value;

        try {
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, pass })
            });

            const data = await res.json();

            if (!res.ok) {
                errorMsg.textContent = data.error || "Error en login";
                return;
            }

            // Enviar evento al Shell
            window.microfrontendBus?.publish("login-success", data);

            console.log("Login exitoso", data);

        } catch (err) {
            console.error("Error:", err);
            errorMsg.textContent = "Error de conexión";
        }
    });
});

