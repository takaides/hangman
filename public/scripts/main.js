let text = document.getElementById("guess");
let form = document.getElementById("input");
text.onkeyup = function() {
  if (text.value.length == 1) {
    console.log(text.value);
    form.submit();
  }
}

window.onload = function() {
  text.focus();
};
