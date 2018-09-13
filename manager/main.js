/* Global variables */

// Scope holders
var gdb;

// Flags
var modalState = false;
var signedIn = false;
var recordExists = false;

// Realtime variables
var volunteerCount = 0;
var ambassadorCount = 0;
var totalCount = 0;
var totalNewCount = 0;
var dateArray = [];
var seriesArray = [0, 0, 0, 0, 0, 0, 0];
var csv = "Name,Email Address,Phone Number,Age,Locality,Designation,Date Of Sign Up,Photo Link,Facebook Link,Twitter Link\n";

// Materialize elements
var modalElements;
var modalInstances;
var featureDiscoveryElements;
var featureDiscoveryInstances;
var selectElements;
var selectInstances
var parallaxElements;
var parallaxInstances;
var tooltipElements;
var tooltipInstances;

// Get last 7 days
for (var i=0; i<7; i++){
	var d = new Date();
	d.setDate(d.getDate() - i);
	dateArray.push(d.getDate());
}
var data = {labels:dateArray.reverse(), series:[seriesArray]};

window.onload = function(){

	// Initialize Materialize Modals
	modalElements = document.querySelectorAll('.modal');
	modalInstances = M.Modal.init(modalElements, {onCloseEnd: onModalClosed, onOpenEnd: onModalOpened});
	console.log("%cMaterialize Modals Initialized!", "background:#222222; color:#BADA55;");

	// Initialize Materialize Feature Discovery
	featureDiscoveryElements = document.querySelectorAll('.tap-target');
	featureDiscoveryInstances = M.TapTarget.init(featureDiscoveryElements, {onClose: onFeatureDiscoveryClosed});
	console.log("%cFeature Discovery Elements Initialized!", "background:#222222; color:#BADA55;");

	// Initialize Materialize Select
	selectElements = document.querySelectorAll('select');
	selectInstances = M.FormSelect.init(selectElements);
	console.log("%cFeature Discovery Elements Initialized!", "background:#222222; color:#BADA55;");

	// Initialize Materialize Parallax
	parallaxElements = document.querySelectorAll('.parallax');
	parallaxInstances = M.Parallax.init(parallaxElements);
	console.log("%cParallax Elements Initialized!", "background:#222222; color:#BADA55;");

	// Initialize Materialize Tooltips
	tooltipElements = document.querySelectorAll('.tooltipped');
	tooltipInstances = M.Tooltip.init(tooltipElements);
	console.log("%cTooltip Elements Initialized!", "background:#222222; color:#BADA55;");

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
			db.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired, doc.data().locality);
				});
				reinitializeTooltips();
			});
		});
	});

	// Listen for data changes
	db.collection("volunteers").onSnapshot(function(querySnapshot){
		volunteerCount = 0;
		ambassadorCount = 0;
		totalCount = 0;
		totalNewCount = 0;
		csv = "Name,Email Address,Phone Number,Age,Locality,Designation,Date Of Sign Up,Photo Link,Facebook Link,Twitter Link\n";
		querySnapshot.forEach((doc) => {
			if(doc.data().designation == "volunteer") volunteerCount++;
			else ambassadorCount++;
			if((Date.parse(new Date()) - Date.parse(doc.data().dateAcquired)) <= (60 * 60 * 24 * 1000)) totalNewCount++;
			for(var i=0; i<dateArray.length; i++) if(new Date(Date.parse(doc.data().dateAcquired)).getDate() == dateArray[i]) seriesArray[i]++;
			// Build CSV
			csv += doc.data().firstName + " " + doc.data().lastName + "," + doc.data().email + "," + doc.data().phone + "," + doc.data().age + "," + doc.data().locality + "," + doc.data().designation + "," + doc.data().dateAcquired + "," + doc.data().photoUrl + "," + doc.data().facebookLink + "," + doc.data().twitterLink + "\n";
		});
		totalCount = volunteerCount + ambassadorCount;
		for(var i=0; i<dateArray.length; i++) if(dateArray[i] == 6) seriesArray[i] +=6;
		var data = {labels:dateArray, series:[seriesArray]};
		// Update values
		document.getElementById("volunteerCount").innerHTML = volunteerCount;
		document.getElementById("ambassadorCount").innerHTML = ambassadorCount;
		document.getElementById("totalCount").innerHTML = totalCount;
		document.getElementById("totalNewCount").innerHTML = totalNewCount;
		updateGraph();
		// Prepare download links
		document.getElementById("downloadButton").download = new Date().getDate() + "-" + new Date().getMonth()+1 + "-" + new Date().getFullYear() + "-" + new Date().getHours() + "-" + new Date().getMinutes() + "-" + new Date().getSeconds() + "_report.csv";
		document.getElementById("downloadButton").href = "data:application/octet-stream," + encodeURI(csv);
		document.getElementById("downloadGraphButton").download = new Date().getDate() + "-" + new Date().getMonth()+1 + "-" + new Date().getFullYear() + "-" + new Date().getHours() + "-" + new Date().getMinutes() + "-" + new Date().getSeconds() + "_graph.svg";
		document.getElementById("downloadGraphButton").href = "data:application/octet-stream," + encodeURI(document.getElementById("acquisitionChart").innerHTML);
	});

	// Handle chips
	document.getElementById("volunteerFilter").onclick = function(){
		document.getElementById("filterOptions").options.selectedIndex = 2;
		document.getElementById("filterOptions").onchange();
	}
	document.getElementById("ambassadorFilter").onclick = function(){
		document.getElementById("filterOptions").options.selectedIndex = 3;
		document.getElementById("filterOptions").onchange();
	}
	document.getElementById("totalFilter").onclick = function(){
		document.getElementById("filterOptions").options.selectedIndex = 1;
		document.getElementById("filterOptions").onchange();
	}

	document.getElementById("totalNewFilter").onclick = function(){
		document.getElementById("filterOptions").options.selectedIndex = 4;
		document.getElementById("filterOptions").onchange();
	}

	// Handle filtering
	document.getElementById("filterOptions").onchange = function(){
		if(document.getElementById("filterOptions").options[document.getElementById("filterOptions").selectedIndex].text === "Everyone"){
			// Refresh table
			document.getElementById("tableContents").innerHTML = "";
			document.getElementById("tableProgress").style.display = "block";
			db.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired, doc.data().locality);
				});
				reinitializeTooltips();

			// Scroll table into view
			document.getElementById("records").scrollIntoView();

		});
		}
		else if(document.getElementById("filterOptions").options[document.getElementById("filterOptions").selectedIndex].text === "Volunteers"){
			// Refresh table
			document.getElementById("tableContents").innerHTML = "";
			document.getElementById("tableProgress").style.display = "block";
			db.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildVolunteerTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation,  doc.data().dateAcquired, doc.data().locality);
				});
				reinitializeTooltips();

			// Scroll table into view
			document.getElementById("records").scrollIntoView();

		});
		}
		else if(document.getElementById("filterOptions").options[document.getElementById("filterOptions").selectedIndex].text === "Ambassadors"){
			// Refresh table
			document.getElementById("tableContents").innerHTML = "";
			document.getElementById("tableProgress").style.display = "block";
			db.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildAmbassadorTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation,  doc.data().dateAcquired, doc.data().locality);
				});
				reinitializeTooltips();

			// Scroll table into view
			document.getElementById("records").scrollIntoView();

		});
		}
		else if(document.getElementById("filterOptions").options[document.getElementById("filterOptions").selectedIndex].text === "New People"){
			// Refresh table
			document.getElementById("tableContents").innerHTML = "";
			document.getElementById("tableProgress").style.display = "block";
			db.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildNewPersonTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation,  doc.data().dateAcquired, doc.data().locality);
				});
				reinitializeTooltips();

			// Scroll table into view
			document.getElementById("records").scrollIntoView();

		});
		}
	}

	// Handle editing
	document.getElementById("updateFieldButton").onclick = function(){
		document.getElementById("updateFieldButton").classList.add("disabled");
		document.getElementById("updateFieldButton").innerHTML = '<i class="material-icons left">update</i>Hold on...';
		switch(document.getElementById("editOptions").options[document.getElementById("editOptions").selectedIndex].text){
			case "Name": pushObject = {firstName : document.getElementById("editField").value}; break;
			case "Email Address": pushObject = {email : document.getElementById("editField").value}; break;
			case "Phone Number": pushObject = {phone : document.getElementById("editField").value}; break;
			case "Age": pushObject = {age : document.getElementById("editField").value}; break;
			case "Locality": pushObject = {locality : document.getElementById("editField").value}; break;
			case "Designation": document.getElementById("editField").disabled="true"; document.getElementById("editField").placeholder="Try upgrading/downgrading concerned person."; break;
			case "Date of sign up": document.getElementById("editField").disabled="true"; document.getElementById("editField").placeholder="Unfortunately, you cannot edit dates."; break;
			case "Photo URL": pushObject = {photoUrl : document.getElementById("editField").value}; break;
			case "Facebook Link": pushObject = {facebookLink : document.getElementById("editField").value}; break;
			case "Twitter Link": pushObject = {twitterLink : document.getElementById("editField").value}; break;
			default: break;
		}
		db.collection("volunteers").doc(document.getElementById("editEmail").value).update(pushObject).then(function(){
			document.getElementById("updateFieldButton").classList.remove("disabled");
			document.getElementById("updateFieldButton").innerHTML = '<i class="material-icons left">update</i>Update';
			document.getElementById("getDetailsButton").click();
		}).catch(function(error){
			console.error("Error writing document: ", error);
		});
	}

	// Handle edit previews
	document.getElementById("editOptions").onchange = function(){
		document.getElementById("editField").disabled=false;
		document.getElementById("updateFieldButton").classList.remove("disabled");
		switch(document.getElementById("editOptions").options[document.getElementById("editOptions").selectedIndex].text){
			case "Name": db.collection("volunteers").doc(document.getElementById("editEmail").value).get().then(function(doc){document.getElementById("editField").value = doc.data().firstName + " " + doc.data().lastName;}); break;
			case "Email Address": db.collection("volunteers").doc(document.getElementById("editEmail").value).get().then(function(doc){document.getElementById("editField").value = doc.data().email}); break;
			case "Phone Number": db.collection("volunteers").doc(document.getElementById("editEmail").value).get().then(function(doc){document.getElementById("editField").value = doc.data().phone}); break;
			case "Age": db.collection("volunteers").doc(document.getElementById("editEmail").value).get().then(function(doc){document.getElementById("editField").value = doc.data().age}); break;
			case "Locality": db.collection("volunteers").doc(document.getElementById("editEmail").value).get().then(function(doc){document.getElementById("editField").value = doc.data().locality}); break;
			case "Designation": document.getElementById("updateFieldButton").classList.add("disabled"); document.getElementById("editField").value=""; document.getElementById("editField").disabled="true"; document.getElementById("editField").placeholder="Upgrade/downgrade person instead."; break;
			case "Date of sign up": document.getElementById("updateFieldButton").classList.add("disabled"); document.getElementById("editField").value=""; document.getElementById("editField").disabled="true"; document.getElementById("editField").placeholder="Unfortunately, you cannot edit dates."; break;
			case "Photo URL": db.collection("volunteers").doc(document.getElementById("editEmail").value).get().then(function(doc){document.getElementById("editField").value = doc.data().photoUrl}); break;
			case "Facebook Link": db.collection("volunteers").doc(document.getElementById("editEmail").value).get().then(function(doc){document.getElementById("editField").value = doc.data().facebookLink}); break;
			case "Twitter Link": db.collection("volunteers").doc(document.getElementById("editEmail").value).get().then(function(doc){document.getElementById("editField").value = doc.data().twitterLink}); break;
			default: break;
		}
	}

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

	// Handle edit participant button click
	document.getElementById("editButton").onclick = function(){
		modalState = true;
		document.getElementById("editEmail").focus();
	}

	// Handle get details button click
	document.getElementById("getDetailsButton").onclick = function(){
		document.getElementById("getDetailsSection").style.display = "none";
		document.getElementById("editLoader").style.display = "block";
		document.getElementById("editParticipantModal").classList.remove("modal-fixed-footer");
		document.getElementById("participantDetailsSection").style.display = "none";
		document.getElementById("participantDetailsEditSection").style.display = "none";
		document.getElementById("participantDetailsTable").innerHTML = "";
		db.collection("volunteers").where("email", "==", document.getElementById("editEmail").value).get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				if(doc.data().designation == "ambassador" || doc.data().designation == "volunteer") recordExists = true;
				buildParticipantDetailsTableRow(capitalize(doc.data().firstName + " " + doc.data().lastName), doc.data().email, doc.data().phone, doc.data().age, doc.data().locality, doc.data().designation, doc.data().dateAcquired, doc.data().photoUrl, doc.data().facebookLink, doc.data().twitterLink);
			});
			reinitializeTooltips();
			document.getElementById("editLoader").style.display = "none";
			if(recordExists){
				document.getElementById("editParticipantModal").classList.add("modal-fixed-footer");
				document.getElementById("participantDetailsSection").style.display = "block";
				document.getElementById("participantDetailsEditSection").style.display = "block";
			}
			else{
				swal("Sorry, that record does not exist.", "", "error");
				modalInstances[2].close();
			}
		});
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
			db.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired, doc.data().locality);
				});
				reinitializeTooltips();

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
			db.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
				querySnapshot.forEach((doc) => {
					// Background fetch complete; hide progress bar
					document.getElementById("tableProgress").style.display = "none";
					buildSearchTableRow(document.getElementById("searchBar").value, doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired, doc.data().locality);
				});
				reinitializeTooltips();

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
		db.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				// Background fetch complete; hide progress bar
				document.getElementById("tableProgress").style.display = "none";
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation,  doc.data().dateAcquired, doc.data().locality);
			});
			reinitializeTooltips();

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
function buildTableRow(name="unknown", email="unknown", designation="unknown", dateAcquired, location="unknown"){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");
	location = location.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}
	// Update table contents
	if(ambassador){
		if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000))
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
		else
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
	}
	else{
		if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000))
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
		else{
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
		}
	}
}

// Build ambassador table rows
function buildAmbassadorTableRow(name="unknown", email="unknown", designation="unknown", dateAcquired, location="unknown"){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");
	location = location.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}

	// Update table contents
	if(ambassador){
		if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
		}
		else{
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
		}
	}
}

// Build volunteer table rows
function buildVolunteerTableRow(name="unknown", email="unknown", designation="unknown", dateAcquired, location="unknown"){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");
	location = location.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}

	// Update table contents
	if(ambassador){
		// Don't do anything
	}
	else{
		if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
		}
		else{
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
		}
	}
}

// Build search table rows
function buildSearchTableRow(searchString="", name="unknown", email="unknown", designation="unknown", dateAcquired, location="unknown"){

	// Flags
	var ambassador = false;
	var recordExists = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");
	location = location.replace(/'/g, "\\'");

	// Handle filtering
	if(name.toLowerCase().includes(searchString.toLowerCase()) || email.toLowerCase().includes(searchString.toLowerCase()) || location.toLowerCase().includes(searchString.toLowerCase())) recordExists = true;

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}

	// Update table contents only if the search is true
	if(recordExists){
		if(ambassador){
			if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
			}
			else{
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
			}
		}
		else{
			if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
			}
			else{
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
			}
		}
	}
}

// Build new person table rows
function buildNewPersonTableRow(name="unknown", email="unknown", designation="unknown", dateAcquired, location="unknown"){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");
	location = location.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}
	// Update table contents
	if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
		if(ambassador){
			if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000))
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
			else
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
		}
		else{
			if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000))
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
			else{
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td><span class="tooltipped" style="cursor:pointer;" data-position="right" data-tooltip="Click to copy" onclick="copyTextToClipboard(this);">'+email+'</span></td><td>'+location+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a>&emsp;<a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="editParticipant(\''+email+'\');" class="btn-floating tooltipped" style="background-color:#FFB500;" data-position="left" data-tooltip="Edit '+name+'\'s details"><i class="material-icons">edit</i></a></td></tr>';
			}
		}
	}
}

// Build Participant Details Table Rows

function buildParticipantDetailsTableRow(name="unknown", email="unknown", phone="unknown", age="unknown", locality="unknown", designation="unknown", dateAcquired, photoUrl="unknown", facebookLink="unknown", twitterLink="unknown"){
	var whatsapp = "91" + phone;
	if(designation == "ambassador") designation = '<span style="color:#FF0000;">Ambassador</span>';
	else designation = '<span style="color:#FFD700;">Volunteer</span>';
	document.getElementById("participantDetailsTable").innerHTML += '<tr><td>Name</td><td>'+name+'</td></tr><tr><td>Email Address</td><td><a class="tooltipped" data-position="right" data-tooltip="Click to send an email" href="mailto:'+email+'">'+email+'</a></td></tr><tr><td>Phone Number</td><td><a class="tooltipped" data-position="right" data-tooltip="Click to place a call" href="tel:+91'+phone+'">'+'+91 '+phone+'</a>&emsp;<a class="tooltipped" data-position="right" data-tooltip="Whatsapp '+name+'" href="https://wa.me/'+whatsapp+'" target="_blank"><img style="vertical-align:middle;" src="../images/whatsapp.png" /></a></td></tr><tr><td>Age</td><td>'+age+'</td></tr><tr><td>Locality</td><td>'+locality+'</td></tr><tr><td>Designation</td><td>'+designation+'</td></tr><tr><td>Date of sign up</td><td>'+dateAcquired+'</td></tr><tr><td>Photo URL</td><td><a href="'+photoUrl+'" target="_blank">'+photoUrl+'</a></td></tr><tr><td>Facebook Link</td><td><a href="'+facebookLink+'" target="_blank">'+facebookLink+'</a></td></tr><tr><td>Twitter Link</td><td><a href="'+twitterLink+'" target="_blank">'+twitterLink+'</a></td></tr>';
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
		gdb.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				// Background fetch complete; hide progress bar
				document.getElementById("tableProgress").style.display = "none";
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired, doc.data().locality);
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
		gdb.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				// Background fetch complete; hide progress bar
				document.getElementById("tableProgress").style.display = "none";
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired, doc.data().locality);
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

	// Send email with secret link to ambassador
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function(){
		if(xmlHttp.readyState == 4 && xmlHttp.status == 200) console.log(xmlHttp.responseText);
	}
	xmlHttp.open("GET", "https://admin.sotf.in/console/sendbprsecretmail.php?fn=" + name + "&eml=" + email, true); // true for asynchronous 
	xmlHttp.send(null);

}

// Reinitialize tooltips
function reinitializeTooltips(){
	tooltipElements = document.querySelectorAll('.tooltipped');
	tooltipInstances = M.Tooltip.init(tooltipElements);
}

// Capitalize names for display
function capitalize(str){
	var splitStr = str.toLowerCase().split(' ');
	for(var i = 0; i < splitStr.length; i++) splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
	return splitStr.join(' '); 
}

// Copy element contents to clipboard
function copyTextToClipboard(tdInstance){
	window.getSelection().removeAllRanges();
	var range = document.createRange();
	range.selectNodeContents(tdInstance);
	window.getSelection().addRange(range);
	document.execCommand("copy");
	document.getElementById("editEmail").value = tdInstance.innerHTML;
	M.toast({html: '<span style="color:#FFD700;">' + tdInstance.innerHTML + '</span>' + "&emsp;Copied to clipboard!"});
}

// Edit Participant
function editParticipant(email){
	document.getElementById("editEmail").value = email;
	modalInstances[2].open();
	document.getElementById("getDetailsButton").click();
}

// Create graph
function updateGraph(){
	new Chartist.Line('#acquisitionChart', data, {low: 0, showArea: true, onlyInteger: true}).on('draw', function(data){
		if(data.type === 'line' || data.type === 'area'){
			data.element.animate({
				d:{
					begin: 2000 * data.index,
					dur: 2000,
					from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
					to: data.path.clone().stringify(),
					easing: Chartist.Svg.Easing.easeOutQuint
				}
			});
		}
	});
}

// Handle modal dismissal
function onModalClosed(){
	modalState = false;
	document.getElementById("editEmail").value = "";
	document.getElementById("getDetailsSection").style.display = "block";
	document.getElementById("participantDetailsSection").style.display = "none";
	document.getElementById("participantDetailsEditSection").style.display = "none";
	document.getElementById("participantDetailsTable").innerHTML = "";
	document.getElementById("editParticipantModal").classList.remove("modal-fixed-footer");
}

// Handle modal open
function onModalOpened(){
	// Update graph
	updateGraph();
	document.getElementById("downloadGraphButton").href = "data:application/octet-stream," + encodeURI(document.getElementById("acquisitionChart").innerHTML);
}

// Handle feature discovery close
function onFeatureDiscoveryClosed(){
document.getElementById("floatingSearchButton").classList.remove("disabled");
}
