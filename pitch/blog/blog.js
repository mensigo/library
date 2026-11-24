// Питч блога: затемнение на входе и выходе, назад по A / Escape.
(() => {
  const fog = document.getElementById("fog");

  // Вход: черный экран гаснет
  const enter = () => {
    fog.classList.remove("is-clear", "is-out");
    void fog.offsetWidth;
    requestAnimationFrame(() => fog.classList.add("is-clear"));
  };
  enter();

  // Возврат со страницы из bfcache: экран мог остаться черным
  addEventListener("pageshow", (e) => { if (e.persisted) enter(); });

  // Выход: экран сгущается, потом назад (или в комнату, если пришли не из нее)
  const back = document.querySelector("[data-back]");
  const leave = () => {
    fog.classList.add("is-out");
    setTimeout(() => {
      if (history.length > 1 && document.referrer) history.back();
      else location.href = back.href;
    }, 450);
  };

  back.addEventListener("click", (e) => { e.preventDefault(); leave(); });

  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest("input, textarea")) return;
    const k = e.key.toLowerCase();
    if (k === "a" || k === "ф" || k === "escape") leave();
  });
})();
