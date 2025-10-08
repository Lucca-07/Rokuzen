const userInterno = document.getElementById("containerUserInterno");
const userExterno = document.getElementById("containerUserExterno");

const selectUser = document.getElementById("usuarioselect");

selectUser.addEventListener("change", () => {
    const userText = selectUser.options[selectUser.selectedIndex].text;
    const userValue = selectUser.options[selectUser.selectedIndex].value;

    userExterno.classList.toggle("d-none");
    userInterno.classList.toggle("d-none");
});
