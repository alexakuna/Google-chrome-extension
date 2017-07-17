

btn.onclick = function () {
	let log = document.querySelector('#login');
	let pas = document.querySelector('#pass');
	if (log.value && pas.value) {
		chrome.storage.sync.set({
			'login': log.value,
			'password': pas.value
		})
		log.value = '';
		pas.value = '';
		popup();
		setTimeout(() => {
			close();
		}, 2000);
	} else {
		alert("Для работы расширения, необходимо ввести логин и пароль от аккаунта seller-online к которому подвязан ваш магазин на Ebay");
	}
	
}
document.querySelector('#close-popup').addEventListener('click', function () {
	close();
})
function popup() {
	document.querySelector('.popup').classList.toggle('popup-change');
}