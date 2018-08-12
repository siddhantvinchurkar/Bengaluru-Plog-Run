// Global variables
var gdb;
var modalState = false;
var signedIn = false;
var modalElements;
var modalInstances;
var featureDiscoveryElements;
var featureDiscoveryInstances;

window.onload = function(){

	// Initialize Materialize Modals
	modalElements = document.querySelectorAll('.modal');
	modalInstances = M.Modal.init(modalElements, {onCloseEnd: onModalClosed, onOpenEnd: onModalOpened});
	console.log("%cMaterialize Modals Initialized!", "background:#222222; color:#BADA55;");

	// Initialize Materialize Feature Discovery
	featureDiscoveryElements = document.querySelectorAll('.tap-target');
	featureDiscoveryInstances = M.TapTarget.init(featureDiscoveryElements, {onClose: onFeatureDiscoveryClosed});
	console.log("%cFeature Discovery Elements Initialized!", "background:#222222; color:#BADA55;");

	// Register a Service Worker
	if('serviceWorker' in navigator) {
	  navigator.serviceWorker
	           .register('sw.js')
	           .then(function() { console.log("%cService Worker Registered!", "background:#222222; color:#BADA55;"); });
	}

	// Set year on footer
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

	// Transfer scope
	gdb = db;

	// Password store
	var pwd = "password";

	// Retrieve password from the database
	db.collection("passwords").get().then((querySnapshot) => {
		querySnapshot.forEach((doc) => {
			pwd = doc.data().pwd;
			// Enable signin
			document.getElementById("password").disabled = false;
			document.getElementById("passwordProgress").style.display = "none";
			document.getElementById("passwordField").style.display = "block";
			document.getElementById("passwordButton").style.display = "block";
			document.getElementById("passwordMessage").style.display = "block";

			// Begin fetching volunteer and/or ambassador records in the background
			db.collection("volunteers").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation);
				});
			});
		});
	});

	// Handle search button click
	document.getElementById("searchButton").onclick = function(){
		document.getElementById('searchBar').dispatchEvent(new KeyboardEvent('keyup',{'keyCode':13}));
	}

	// Handle floating search button click
	document.getElementById("floatingSearchButton").onclick = function(){
		if(signedIn){
			if(!modalState){
				modalState = true;
				M.Modal.getInstance(searchModal).open();
				document.getElementById("searchBar").value = null;
				document.getElementById("searchBar").focus();
			}
		}
	}

	// Handle Sign in
	document.getElementById("passwordButton").onclick = function(){
		if(document.getElementById("password").value === pwd){

			// Password is correct; grant access
			document.getElementById("signInCard").style.display = "none";
			document.getElementById("records").style.display = "block";

			// Tell people about the search functionality
			M.TapTarget.getInstance(floatingSearchButtonFeatureDiscovery).open();
			setTimeout(function(){M.TapTarget.getInstance(floatingSearchButtonFeatureDiscovery).close();}, 3000);

			// Change signedIn state
			signedIn = true;
		}
		else{
			// Password is wrong; deny access
			swal("Nope. Try again.", "", "error");
		}
	}

	// Handle enter keypress
	document.getElementById("password").addEventListener("keyup", function(event) {
		event.preventDefault();
		if(event.keyCode === 13){
			document.getElementById("passwordButton").click();
		}
	});

	// Handle keypresses
	document.addEventListener("keydown", function(event) {
		// Handle 'spacebar'
		if(event.keyCode === 32){
			// Refresh table
			document.getElementById("tableContents").innerHTML = "";
			document.getElementById("tableProgress").style.display = "block";
			db.collection("volunteers").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation);
				});
					// Scroll table into view
				document.getElementById("records").scrollIntoView();
				});
		}
		// Handle letters
		else if(event.keyCode >= 65 && event.keyCode <= 90){
			if(signedIn){
				if(!modalState){
					modalState = true;
					M.Modal.getInstance(searchModal).open();
					document.getElementById("searchBar").value = null;
					document.getElementById("searchBar").focus();
				}
			}
		}
	});

	// Handle enter keypress for search
	document.getElementById("searchBar").addEventListener("keyup", function(event) {
		event.preventDefault();
		if(event.keyCode === 13){
			// Refresh table
			document.getElementById("tableContents").innerHTML = "";
			document.getElementById("tableProgress").style.display = "block";
			db.collection("volunteers").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildSearchTableRow(document.getElementById("searchBar").value, doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation);
				});
				// Scroll table into view
				document.getElementById("records").scrollIntoView();
			});
			M.Modal.getInstance(searchModal).close();
			modalState = false;
		}
	});

	// Handle refresh
	document.getElementById("refreshButton").onclick = function(){
			// Refresh table
		document.getElementById("tableContents").innerHTML = "";
		document.getElementById("tableProgress").style.display = "block";
		db.collection("volunteers").get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				// Background fetch complete; hide progress bar
				document.getElementById("tableProgress").style.display = "none";
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation);
			});

			// Scroll table into view
			document.getElementById("records").scrollIntoView();

		});

	}

}

// Handle button hover
function startPulse(button){
	button.classList.add("pulse");
}

function stopPulse(button){
	button.classList.remove("pulse");
}

// Build table rows
function buildTableRow(name="unknown", email="unknown", designation="unknown"){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = name.replace(/'/g, "\\'");
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}

	// Update table contents
	if(ambassador)
		document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating" style="background-color:#AA0000;" title="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
	else
		document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating" title="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';

}

// Build table rows
function buildSearchTableRow(searchString="", name="unknown", email="unknown", designation="unknown"){

	// Flags
	var ambassador = false;
	var recordExists = false;

	// Handle single quotes
	name = name.replace(/'/g, "\\'");
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");

	// Handle filtering
	if(name.includes(searchString) || email.includes(searchString)) recordExists = true;

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}

	// Update table contents only if the search is true
	if(recordExists){
		if(ambassador) document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating" style="background-color:#AA0000;" title="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
		else document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating" title="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
	}
}

// Handle upgrades and downgrades
function downgradeAmbassador(name, email){

	// Start Work
	document.getElementById("tableProgress").style.display = "block";

	// Update Firestore document
	gdb.collection("volunteers").doc(email).update({
		designation: "volunteer"
	})
	.then(function(docRef) {

		// Refresh table
		document.getElementById("tableContents").innerHTML = "";
		document.getElementById("tableProgress").style.display = "block";
		gdb.collection("volunteers").get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				// Background fetch complete; hide progress bar
				document.getElementById("tableProgress").style.display = "none";
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation);
			});

			// Display toast
			M.toast({html: name + ' is now a volunteer!', classes: 'rounded'});

			// Scroll table into view
			document.getElementById("records").scrollIntoView();

			});
		})
		.catch(function(error) {
			console.error("Error adding document: ", error);
		});

	}

function upgradeVolunteer(name, email){

	// Start Work
	document.getElementById("tableProgress").style.display = "block";

	// Update Firestore document
	gdb.collection("volunteers").doc(email).update({
		designation: "ambassador"
	})
	.then(function(docRef) {

		// Refresh table
		document.getElementById("tableContents").innerHTML = "";
		document.getElementById("tableProgress").style.display = "block";
		gdb.collection("volunteers").get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				// Background fetch complete; hide progress bar
				document.getElementById("tableProgress").style.display = "none";
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation);
			});

			// Display toast
			M.toast({html: name + ' is now an ambassador!', classes: 'rounded'});

			// Scroll table into view
			document.getElementById("records").scrollIntoView();

		});

	})
	.catch(function(error) {
		console.error("Error adding document: ", error);
	});

}

// Handle modal dismissal
function onModalClosed(){
modalState = false;
}

// Handle modal open
function onModalOpened(){
// Do stuff here
}

// Handle feature discovery close
function onFeatureDiscoveryClosed(){
console.log("here");
document.getElementById("floatingSearchButton").classList.remove("disabled");
}