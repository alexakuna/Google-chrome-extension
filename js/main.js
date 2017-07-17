
chrome.storage.sync.get(['login', 'password'], function (budget) {
	if (budget.login && budget.password) {
		TTN(budget);
	} else {
		alert("Необходимо настроить раширение TTN. Для этого кликните правой кнопкой мыши по иконке расширения и в появившемся окошке введите логин и пароль для вашего аккаунта на seller-online.com, перезагрузите страницу Ebay. Это все! Пользуйтесь раширением!");
	}
	
});

const TTN = function (data) {

	getInfoTrackingShipment("https://www.seller-online.com/logoff.php");

	let login = data.login;
	let password = data.password;
	//login = login.replace(/@/g, '%40');
	console.log(login);
	console.log(password);

	const winLocHref = window.location.href; // Текущий url. Необходим для выяснения на какой странице создавать две кнопки -> Отследить и Seller а где только одну -> Seller.
	const blocks = document.querySelectorAll("#BuyerEmail div[style='color:#333;white-space:normal;float:left;']"); //Блоки где будут размещаться наши кнопки.
	const regexp = /(^[a-z]{2}[0-9]{9}[a-z]{2}$)/i; //Шаблон для валидации трек номера.

	//Url адреса. Используются для удаленного получения данных.
	const urlLog = "https://www.seller-online.com/login.php?doAction=process&login=" + login.trim() + "+&password=" + password.trim() + "&retURL=&x=35&y=16";
	console.log(urlLog);
	let urlEmail = "https://www.seller-online.com/search_order.php?search_by=order_email&orders_type=all&search_text=";
	let urlOrds = "https://www.seller-online.com/view_order.php?order_id=";
	let urlOrds2 = "https://www.seller-online.com/search_order.php?search_by=order_shop_id&orders_type=all&search_text=";
	let urlOrds3 = "http://www.trackitonline.ru/?service=track&barCode=+";
	let urlOrds4  = "&dstn=";
	let urlOrds5 = "&Post=XX&x=46&y=48';";
	//Функция для создания ДОМ элементов.
	function createElement(tag, props, ...children) {
		let element = document.createElement(tag);
		if (typeof props === 'object') {
			Object.keys(props).forEach(key => element[key] = props[key]);
		} else {
			let str = document.createTextNode(props);
			element.appendChild(str);
			return element;
		}
		if (children.length > 0) {
			children.forEach(child => {
				if (typeof child === "string") {
					child = document.createTextNode(child);
				}
				element.appendChild(child);
			});
		}
		return element;
	}

	function createBtnTrackingAndSellerer() { //Функция для создания кнопок - "Отследить посылку" и "Seller". Также для навешивания обработчиков событий.
		let block = 0;
		for (; block < blocks.length; block++) {
			blocks[block].style.display = 'flex';
			blocks[block].style.flexWrap = 'wrap';
			const btnTrack = createElement('button', {className: 'btn-tracking ui green inverted button mini'}, 'Отследить посылку');
			const btnSeller = createElement('button', {className: 'btn-seller ui green inverted button mini'}, 'Seller');
			blocks[block].appendChild(btnTrack);
			blocks[block].appendChild(btnSeller);
			btnTrack.addEventListener("click", trackingMyParcel, false);
			btnSeller.addEventListener("click", sellerOnline, false);
		}
	}

	function createBtnSeller() { //Функция для создания только кнопки "Seller". Также для навешивания обработчика событий.
		let block = 0;
		for (; block < blocks.length; block++) {
			const btnSeller = createElement('button', {className: 'btn-seller ui green inverted button mini'}, 'Seller');
			btnSeller.style.width =  100 + '%';
			blocks[block].appendChild(btnSeller);
			btnSeller.addEventListener("click", sellerOnline, false);
		}
	}

	winLocHref.indexOf("WaitShipment") != -1 ? createBtnSeller() : createBtnTrackingAndSellerer(); //В соответствии с условием запускаем нужную функцию.

	function insertPhoneNumber(value) { // Добавляем номер телефона в уже созданый документ.
		let elem = document.querySelectorAll('.popup-seller table')[1].firstChild.nextElementSibling;
		elem.innerHTML += '<tr><td>Номер телефона покупателя: ' + '<span style="color: yellow;">' + value + '</span>' + '</td></tr>';
	}

	function deletetInfo(e) { //Удаляем ДОМ элемент с полученными данными.
		e.preventDefault();
		let trg = e.target;
		let parent = trg.parentNode.parentNode;
		parent.removeChild(trg.parentNode);
		let btn = parent.querySelector('.btn-tracking');
		btn.removeAttribute('disabled');
		btn.style.opacity = '';
	}

	function startPreloaderAndBtnTrack(tg) { //Запуск анимации прелоадинга и деактивации кнопки.
		tg.disabled = 'disabled';
		tg.style.opacity = '0.3';
		tg.classList.add("loading");
	}

	function endPreloaderAndBtnTrack(tg) { //Убераем анимацию прелоадинга и активируем кнопку.
		tg.classList.remove("loading");
		tg.removeAttribute('disabled');
		tg.style.opacity = '';
	}

	function transformHtmlTextInHTML(htmlText, query) {
		const pre = document.createElement('pre');
		pre.innerHTML = htmlText;
		return pre.querySelectorAll(query);
	}

	function getInfoTrackingShipment(url, target) { 
		return new Promise (function (resolve, reject) {
	    	let xhr = new XMLHttpRequest();
	    	xhr.timeout = 30000;
		    xhr.open('GET', url, true);

		    xhr.onload = function() {
				if (this.status == 200) {
				    resolve(this.response);
				} else {
					alert(this.status + ' Внутренняя ошибка сервера. Попробуйте позже отследить отправление.')
				    var error = new Error(this.status);
			        error.code = this.status;
			        reject(error);
				}
		    };
		    xhr.onerror = function() {
	    		reject(this.status);
			};
		    
			xhr.ontimeout = function() {
			  alert( 'Ребят, попытка отследить отправление не удалось, запрос превысил максимальное время. Скорее всего это результат не предвиденной ошибки. Повторите попытку позже.');
			  endPreloaderAndBtnTrack(target);
			  return;
			}
		    xhr.send();
		})
	}

	function trackingMyParcel (e) { // Функция инициации отслеживания.
		e.preventDefault();
		let tg 		 = e.target,
		parentBlock  = tg.parentNode,
		links		 = parentBlock.querySelectorAll("a"),
		trackN 		 = links[1].textContent,
		idItem 		 = parentBlock.querySelector('span').textContent,
		error45 = 0;
		errorAccess = false;

		let tbody = tg.parentNode.parentNode.parentNode.parentNode.previousElementSibling,
		email = tbody.querySelector('#BuyerEmail span').nextElementSibling.textContent;
		console.log(email);
		startPreloaderAndBtnTrack(tg);

		if (regexp.test(trackN) == false) {
			alert("Не коректный трек номер. Скорее всего трек номер не правильно вбит на seller-online или на Ebay.");
			endPreloaderAndBtnTrack(tg);
			return;
		}

		getInfoTrackingShipment(urlLog, tg).then(function (res) {
			var html = document.createElement('pre');
			html.innerHTML = res;
			if(html.querySelector('.errorMessage') != null ) {
				errorAccess = true;
				return Promise.reject();
			}

		}).then(function () {

		  return getInfoTrackingShipment(urlOrds2 + idItem, tg);

		}).then(function(order) {
		  let x = transformHtmlTextInHTML(order, '.main-text a');
		  if (x.length > 1) {
		  	return getInfoTrackingShipment(urlEmail + email, tg);
		  } else {
		  	return getInfoTrackingShipment(urlOrds + x[0].textContent, tg);
		  }

		}).then(function (val) {
			let x = transformHtmlTextInHTML(val, '.simple-table .DataCell')[15].textContent;
			console.log(x);
			let arr = x.split(' ');
			let num = arr.length - 1;
			let coutreCode = Countres.getCodeCountre(arr[num]);
			console.log(coutreCode[0]);
			let urr = urlOrds3 + trackN + urlOrds4 + coutreCode[0] + urlOrds5;
			return getInfoTrackingShipment(urr, tg);
		}).then(function(reqt, error) {
			let html = document.createElement('pre');
			html.innerHTML = reqt;
			tg.classList.remove("loading");

			let sp1 = createElement('span', {className: 'btn-close-active'});
			let sp2 = createElement('span', {id: 'btnClsResTrack'}, sp1)
			let div = createElement('div', {id: 'resultResTracking'}, sp2);
			
			if (transformHtmlTextInHTML(reqt, '.striped') == null) {
				throw error;
			}

			let x = html.querySelectorAll('.striped .mobile-hide');
			let a = html.querySelectorAll('.striped .mobile-hide a');
			let arr = Array.prototype.slice.call(x);
			let arr2 = Array.prototype.slice.call(a);
			arr.forEach(function (i) {
				i.querySelector('.liketable-cell.text-center.text-nowrap div').style.whiteSpace = "nowrap";
				div.appendChild(i);
			})
			arr2.forEach(function (i) {
				i.removeAttribute('href');
			})
			parentBlock.appendChild(div);
			btnClsResTrack.addEventListener('click', deletetInfo, false);

		}).catch(function (err) {
			if (err) error45 += 1;
		    console.error(err);
		  return getInfoTrackingShipment(urlEmail + email, tg);
		 
		}).then(function (val) {
			tg.classList.add("loading");
			let x = transformHtmlTextInHTML(val, '.main-text a');
			// if (x.length === 0) {
			// 	alert('Мультилоты которым более 45 дней с момента отправки на данный момент этим приложением не отслеживаются. Воспользуйтесь одним из доступных сервисов для отслеживания.');
			// }
			return getInfoTrackingShipment(urlOrds + x[0].textContent, tg);
		}).then(function (val) {
			let x = transformHtmlTextInHTML(val, '.simple-table .DataCell')[15].textContent;
			console.log(x);
			let arr = x.split(' ');
			let num = arr.length - 1;

			let coutreCode = Countres.getCodeCountre(arr[num]);
			//console.log(coutreCode[0]);
			let urr = urlOrds3 + trackN + urlOrds4 + coutreCode[0] + urlOrds5;

			return getInfoTrackingShipment(urr, tg);

		}).then(function (val, error) {
			var html = document.createElement('pre');
			html.innerHTML = val;

			let sp1 = createElement('span', {className: 'btn-close-active'});
			let sp2 = createElement('span', {id: 'btnClsResTrack'}, sp1)
			let div = createElement('div', {id: 'resultResTracking'}, sp2);
			if (html.querySelector('.striped')  == null) {
				//alert('Данные об отправке по трек номеру ' + trackN + ' в настоящее время отсутствуют, потому что не зарегестрированы в системе');
				throw error = null;
			}
			let x = html.querySelectorAll('.striped .mobile-hide');
			let a = html.querySelectorAll('.striped .mobile-hide a');
			let arr = Array.prototype.slice.call(x);
			let arr2 = Array.prototype.slice.call(a);
			arr.forEach(function (i) {
				i.querySelector('.liketable-cell.text-center.text-nowrap div').style.whiteSpace = "nowrap";
				div.appendChild(i);
			})
			arr2.forEach(function (i) {
				i.removeAttribute('href');
			})
			parentBlock.appendChild(div);
			btnClsResTrack.addEventListener('click', deletetInfo, false);
			tg.classList.remove("loading");
		}).catch(function (err) {
			if (error45 == 1 && err) {
				alert('Мультилоты которым более 45 дней с момента отправки на данный момент этим приложением не отслеживаются. Воспользуйтесь одним из доступных сервисов для отслеживания.');
				error45 = 0;
				return;
			}
			console.error(err);
			tg.classList.remove("loading");
			if (errorAccess == true) {
				let block = document.createElement("div");
				block.innerHTML = "<span id='btnClsResNote'></span><p>Неверный 'Логин' и/или 'пароль' на seller-online.com.</p>";
				block.className = "note-block";
				block.style.width = 100 + '%';
				parentBlock.appendChild(block);
				btnClsResNote.addEventListener('click', function () {
					let b = parentBlock.querySelector('.note-block');
					parentBlock.removeChild(b);
					endPreloaderAndBtnTrack(tg);
				}, false);
				return;
			} else {
			if (document.querySelector("#resultResTracking") == null) {
					let block = document.createElement("div");
					block.innerHTML = "<span id='btnClsResNote'></span><p>Ошибка отслеживания. Попробуйте позже или перейдите на <a href='http://www.trackitonline.ru'>http://www.trackitonline.ru</p></a>";
					block.className = "note-block";
					parentBlock.appendChild(block);
					btnClsResNote.addEventListener('click', function () {
						let b = parentBlock.querySelector('.note-block');
						parentBlock.removeChild(b);
						let btn = parentBlock.querySelector('.btn-tracking');
						btn.removeAttribute('disabled');
						btn.style.opacity = '';
					}, false);
				}
			}

		});
	}

	function sellerOnline(e) {
		e.preventDefault();

		let tg 		 = e.target,
		parentBlock  = tg.parentNode,
		idItem 		 = parentBlock.querySelector('span').textContent;

		let tbody = tg.parentNode.parentNode.parentNode.parentNode.previousElementSibling,
		getRecordId = tbody.querySelector('#RecordNumber a').href;
	
		startPreloaderAndBtnTrack(tg); 

		getInfoTrackingShipment(urlLog).then(function (res) {
			var html = document.createElement('pre');
			html.innerHTML = res;
			if(html.querySelector('.errorMessage') != null ) {
				let block = document.createElement("div");
				block.innerHTML = "<span id='btnClsResNote'></span><p>Неверный 'Логин' и/или 'пароль' на seller-online.com.</p>";
				block.className = "note-block";
				block.style.width = 100 + '%';
				parentBlock.appendChild(block);
				btnClsResNote.addEventListener('click', function () {
					let b = parentBlock.querySelector('.note-block');
					parentBlock.removeChild(b);
					endPreloaderAndBtnTrack(tg);
				}, false);
			}
		}).then(function () {
			return getInfoTrackingShipment(urlOrds2 + idItem, tg);
		}).then(function(order) {
			var html = document.createElement('pre');
			html.innerHTML = order;
			let x = html.querySelectorAll('.main-text a');
			console.log(x)
			if (x.length > 1) {
				alert('Данное приложение не работает с мультилотами. Для получения информации по мультилотам перейдите в ручную на seller-online.com.');
				 return Promise.reject();
			}
			return getInfoTrackingShipment(urlOrds + x[0].textContent, tg);

		}).then(function (val) {
			tg.classList.remove("loading");
			var html = document.createElement('pre');
			html.innerHTML = val;
			let content = html.querySelector('.simple-table td[style="padding-left:10px; padding-right:10px;"]').innerHTML;
			let html2 = document.createElement('div');

			html2.className = 'popup-seller';
			html2.innerHTML = content;
			let tr = html2.querySelectorAll('.popup-seller table tbody tr td')[1];

			tr.innerHTML = '<button class="btn-close-popup">X</button>';
			let div = document.querySelector('.dataTbl');
			div.appendChild(html2);
			body.style.overflowY = 'hidden';
			let butt = document.querySelector(".btn-close-popup");

			butt.addEventListener('click', function (event) {
				event.preventDefault();
				let div111 = document.querySelector('.popup-seller');
				div.removeChild(div111);
				body.style.overflowY = '';
			tg.removeAttribute('disabled');
			tg.style.opacity = '';
		}, false)
			return getInfoTrackingShipment(getRecordId, tg);
		}).then(function (record) {
			let html = document.createElement('pre');
				html.innerHTML = record;
				let val = html.querySelectorAll('#ERSContainer tr')[10].querySelector('b label');
				if (!val) {
					let phoneNumber = html.querySelectorAll('#ERSContainer tr')[10].querySelector('input').value;
					insertPhoneNumber(phoneNumber);
				} else {
					let phoneNumber = html.querySelectorAll('#ERSContainer tr')[10].querySelector('b label').nextElementSibling.value;
					insertPhoneNumber(phoneNumber);
				}
		}).catch(function (err) {
			console.error(err);
			endPreloaderAndBtnTrack(tg);
		});
	}
};

	

