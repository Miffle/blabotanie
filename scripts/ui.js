
const sounds = {
    incoming: new Audio("resources/sounds/call.mp3"),
    newMessage: new Audio("resources/sounds/newMessage.mp3")
    //    end: new Audio("assets/sounds/end-call.mp3")
};
const { ipcRenderer } = require("electron");
let callStartTime = null;
let callTimerInterval = null;
ipcRenderer.on("update_progress", (event, percent) => {
    document.getElementById("update-container").style.display = "block";
    document.getElementById("update-progress").value = percent;
    document.getElementById("update-percent").innerText = `${Math.floor(percent)}%`;
});



ipcRenderer.on("update_ready", () => {
    // Например, автоматически начать установку
    ipcRenderer.send("install_update");
});
// Проверяем токены при загрузке страницы
window.onload = () => {
    if (window.location.pathname.endsWith("index.html")) {

        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (token && refreshToken) {
            console.log("Токены найдены. Попытка обновить...");
            refreshTokenMethod(refreshToken).then(() => {
                playSound();  // Воспроизводим звук после успешного обновления токенов
            }).catch((err) => {
                console.error("Ошибка при обновлении токенов:", err);
            });
        } else {
            console.log("Токены не найдены. Перенаправляем на страницу авторизации.");
            // Можно включить здесь воспроизведение звука, если это необходимо
        }
    }
    else{
        const savedVolume = localStorage.getItem("notificationVolume");
        const slider = document.getElementById("notification-volume-slider");
        const volume = savedVolume !== null ? parseFloat(savedVolume) : 1;

        if (slider) {
            slider.value = volume;
            sounds.incoming.volume = volume;
            sounds.newMessage.volume = volume;

            slider.addEventListener("input", (e) => {
                const vol = parseFloat(e.target.value);
                localStorage.setItem("notificationVolume", vol);
                sounds.incoming.volume = vol;
                sounds.newMessage.volume = vol;
            });
        }
    }
};
window.addEventListener("beforeunload", () => {
    if (peerConnection && currentCallUser) {
        stompClient.publish({
            destination: "/app/call/end",
            body: JSON.stringify({ recipientId: currentCallUser })
        });
    }
});

document.getElementById("current-username").innerText = `👤 ${localStorage.getItem("username")}`;
function playSound() {
    sounds.incoming.play().then(() => {
        sounds.incoming.pause();
        sounds.incoming.currentTime = 0;
    }).catch((e) => {
        console.log("Автовоспроизведение пока недоступно:", e.message);
    });
}
function unlockAudio() {
    // "разрешить" воспроизведение, вызвав play() с паузой
    sounds.incoming.play().then(() => {
        sounds.incoming.pause();
        sounds.incoming.currentTime = 0;
    }).catch(err => {
        console.warn("Автозапуск звука заблокирован:", err);
    });

    // делаем один раз
    document.removeEventListener("click", unlockAudio);
}
document.addEventListener("click", unlockAudio);
const volumeSlider = document.getElementById("notification-volume-slider");
volumeSlider.addEventListener("input", () => {
    const volume = parseFloat(volumeSlider.value);
    sounds.incoming.volume = volume;
    sounds.newMessage.volume = volume;
    localStorage.setItem("notificationVolume", volume)});

function updateSectionVisibility(sectionId, items) {
    const section = document.getElementById(sectionId);
    const title = section.previousElementSibling;
    section.style.display = items.length > 0 ? "block" : "none";
    if (title && title.tagName === 'H2') {
        title.style.display = items.length > 0 ? "block" : "none";
    }
}
