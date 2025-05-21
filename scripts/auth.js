// Логика авторизации
async function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass }),
        });

        if (!res.ok) throw new Error("Неверные данные");

        const data = await res.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("username", data.username);
        window.location.href = "main.html";  // Переход на главную страницу
    } catch (e) {
        console.log('Ошибка:', e.message);
        document.getElementById("login-error").innerText = "Ошибка: " + e.message;
    }
}
async function register(){
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    try{
        const res = await fetch(`${API_URL}/api/auth/register`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass }),
        });
        const data = await res.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("username", data.username);
        window.location.href = "main.html";  // Переход на главную страницу
    }catch (e){
        console.log('Ошибка:', e.message);
        document.getElementById("login-error").innerText = "Ошибка: " + e.message;
    }
}
async function refreshTokenMethod(refreshToken) {
    try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken: refreshToken }),
        });

        if (!res.ok) {
            throw new Error("Не удалось обновить токены.");
        }

        const data = await res.json();
        console.log("Токены обновлены успешно:", data);

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("username", data.username);
        window.location.href = "main.html";  // Переход на главную страницу

    } catch (e) {
        console.error("Ошибка при обновлении токенов:", e);
        //        window.location.href = "index.html";  // Перенаправляем на страницу авторизации
    }
}
