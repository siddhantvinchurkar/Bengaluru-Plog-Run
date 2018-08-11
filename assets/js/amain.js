window.onload = function(){

		// Set footer year
		document.getElementById("footerYear").innerHTML = new Date().getFullYear();

		// Initialize Firebase
		firebase.initializeApp({
			apiKey: 'AIzaSyBgEsyiffCICWGf32cc4SspPa4MvKJf1Hw',
			authDomain: 'bengaluru-plog-run.firebaseapp.com',
			projectId: 'bengaluru-plog-run'
		});

		// Acknowledge changes
		firebase.firestore().settings({timestampsInSnapshots: true});

		// Initialize Cloud Firestore through Firebase
		var db = firebase.firestore();

		db.collection("volunteers").get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				if(doc.data().designation !== "volunteer"){
					document.getElementById("loader").style.display = "none";
					buildCard(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().organization, doc.data().locality, doc.data().photoUrl, doc.data().facebookLink, doc.data().twitterLink);
				}
			});
		});

		// Handle homer click
		document.getElementById("homer").onclick = function(){
			window.location.href = "../";
		}

	}

// Card Builder
function buildCard(name, email, organisation, locality, photoUrl, facebookLink, twitterLink){

	// Escape single quotes before use
	name = name.replace(/'/g, "\\'");
	email = email.replace(/'/g, "\\'");
	organisation = organisation.replace(/'/g, "\\'");
	locality = locality.replace(/'/g, "\\'");
	photoUrl = photoUrl.replace(/'/g, "\\'");
	facebookLink = facebookLink.replace(/'/g, "\\'");
	twitterLink = twitterLink.replace(/'/g, "\\'");

	document.getElementById("cardContainer").innerHTML += '<div class="at-column"><div class="at-user"><div class="at-user__avatar"><img src="'+photoUrl+'" /></div><div class="at-user__name">'+name+'</div><div class="at-user__title">'+organisation+'</div><div class="at-user__location">'+locality+'</div><ul class="at-social"><li class="at-social__item"><a href="'+facebookLink+'"><svg viewBox="0 0 24 24" width="18" height="18" xmlns="https://www.w3.org/2000/svg"><path d="M14 9h3l-.375 3H14v9h-3.89v-9H8V9h2.11V6.984c0-1.312.327-2.304.984-2.976C11.75 3.336 12.844 3 14.375 3H17v3h-1.594c-.594 0-.976.094-1.148.281-.172.188-.258.5-.258.938V9z" fill-rule="evenodd"></path></svg></a></li><li class="at-social__item"><a href="'+twitterLink+'"><svg viewBox="0 0 24 24" width="18" height="18" xmlns="https://www.w3.org/2000/svg"><path d="M20.875 7.5v.563c0 3.28-1.18 6.257-3.54 8.93C14.978 19.663 11.845 21 7.938 21c-2.5 0-4.812-.687-6.937-2.063.5.063.86.094 1.078.094 2.094 0 3.969-.656 5.625-1.968a4.563 4.563 0 0 1-2.625-.915 4.294 4.294 0 0 1-1.594-2.226c.375.062.657.094.844.094.313 0 .719-.063 1.219-.188-1.031-.219-1.899-.742-2.602-1.57a4.32 4.32 0 0 1-1.054-2.883c.687.328 1.375.516 2.062.516C2.61 9.016 1.938 7.75 1.938 6.094c0-.782.203-1.531.609-2.25 2.406 2.969 5.515 4.547 9.328 4.734-.063-.219-.094-.562-.094-1.031 0-1.281.438-2.36 1.313-3.234C13.969 3.437 15.047 3 16.328 3s2.375.484 3.281 1.453c.938-.156 1.907-.531 2.907-1.125-.313 1.094-.985 1.938-2.016 2.531.969-.093 1.844-.328 2.625-.703-.563.875-1.312 1.656-2.25 2.344z" fill-rule="evenodd"></path></svg></a></li><li class="at-social__item"><a href="mailto:'+email+'"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg></a></li></ul></div></div>';
}
