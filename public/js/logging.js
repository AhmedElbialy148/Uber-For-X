const loginText = document.querySelector(".title-text .login");
const citizenLoginForm = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector("form .signup-link a");
const copBtn = document.querySelector("label.cop");
const citizenBtn = document.querySelector("label.citizen");
const formContainer = document.querySelector(".form-inner");
const logSlider = document.querySelector(".log-slide-controls");
const coordsInputs = document.querySelectorAll(".coordsInput");

navigator.geolocation.getCurrentPosition((position) => {
  coordsInputs.forEach((input) => {
    input.value = position.coords.latitude + " " + position.coords.longitude;
  });
});

signupBtn.onclick = () => {
  citizenLoginForm.style.marginLeft = "-50%";
  //   loginText.style.marginLeft = "-50%";
  formContainer.style.width = "200%";
};
loginBtn.onclick = () => {
  citizenLoginForm.style.marginLeft = "0%";
  //   loginText.style.marginLeft = "0%";
  formContainer.style.width = "300%";
};
signupLink.onclick = () => {
  signupBtn.click();
  return false;
};

copBtn.onclick = () => {
  citizenLoginForm.style.marginLeft = "-100%";
  //   loginText.style.marginLeft = "-100%";
  formContainer.style.width = "200%";
  logSlider.classList.add("disable");
};

citizenBtn.onclick = () => {
  logSlider.classList.remove("disable");
  loginBtn.click();
  return false;
};

if (citizenBtn.classList.contains("selected")) {
  citizenBtn.click();
}
if (copBtn.classList.contains("selected")) {
  copBtn.click();
}
if (loginBtn.classList.contains("selected")) {
  loginBtn.click();
}
if (signupBtn.classList.contains("selected")) {
  signupBtn.click();
}
