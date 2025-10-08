const userInterno = document.getElementById("containerUserInterno");
const userExterno = document.getElementById("containerUserExterno");

const selectUser = document.getElementById("usuarioselect");

selectUser.addEventListener("change", () => {
    userExterno.classList.toggle("d-none");
    userInterno.classList.toggle("d-none");
});
