/* Global variables */

// Scope holders
var gdb;

// Flags
var modalState = false;
var signedIn = false;

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
					buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired);
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
					buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired);
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
					buildVolunteerTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation,  doc.data().dateAcquired);
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
					buildAmbassadorTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation,  doc.data().dateAcquired);
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
					buildNewPersonTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation,  doc.data().dateAcquired);
				});
				reinitializeTooltips();

			// Scroll table into view
			document.getElementById("records").scrollIntoView();

		});
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
					buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired);
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
					buildSearchTableRow(document.getElementById("searchBar").value, doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired);
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
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation,  doc.data().dateAcquired);
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
function buildTableRow(name="unknown", email="unknown", designation="unknown", dateAcquired){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}
	// Update table contents
	if(ambassador){
		if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000))
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
		else
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
	}
	else{
		if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000))
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
		else{
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
		}
	}
}

// Build ambassador table rows
function buildAmbassadorTableRow(name="unknown", email="unknown", designation="unknown", dateAcquired){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}

	// Update table contents
	if(ambassador){
		if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
		}
		else{
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
		}
	}
}

// Build volunteer table rows
function buildVolunteerTableRow(name="unknown", email="unknown", designation="unknown", dateAcquired){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}

	// Update table contents
	if(ambassador){
		// Don't do anything
	}
	else{
		if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
		}
		else{
			document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
		}
	}
}

// Build search table rows
function buildSearchTableRow(searchString="", name="unknown", email="unknown", designation="unknown", dateAcquired){

	// Flags
	var ambassador = false;
	var recordExists = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");

	// Handle filtering
	if(name.toLowerCase().includes(searchString.toLowerCase()) || email.toLowerCase().includes(searchString.toLowerCase())) recordExists = true;

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}

	// Update table contents only if the search is true
	if(recordExists){
		if(ambassador){
			if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
			}
			else{
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
			}
		}
		else{
			if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
			}
			else{
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
			}
		}
	}
}

// Build new person table rows
function buildNewPersonTableRow(name="unknown", email="unknown", designation="unknown", dateAcquired){

	// Flags
	var ambassador = false;

	// Handle single quotes
	name = capitalize(name.replace(/'/g, "\\'"));
	email = email.replace(/'/g, "\\'");
	designation = designation.replace(/'/g, "\\'");

	// Handle designation styling
	if(designation === "volunteer") designation = '<td style="color:#FFD700;">Volunteer</td>';
	else {designation = '<td style="color:#FF0000;">Ambassador</td>'; ambassador = true;}
	// Update table contents
	if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000)){
		if(ambassador){
			if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000))
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
			else
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="downgradeAmbassador(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" style="background-color:#AA0000;" data-position="left" data-tooltip="Downgrade '+name+' to Volunteer"><i class="material-icons">arrow_downward</i></a></td></tr>';
		}
		else{
			if((Date.parse(new Date()) - Date.parse(dateAcquired)) <= (60 * 60 * 24 * 1000))
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'&emsp;<a href="#!" class="collection-item tooltipped" data-position="bottom" data-tooltip="'+dateAcquired+'"><span class="new badge">+</span></a></td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
			else{
				document.getElementById("tableContents").innerHTML += '<tr><td>'+name+'</td><td>'+email+'</td>'+designation+'<td><a href="#someemailservice" onmouseover="startPulse(this);" onmouseout="stopPulse(this);" onclick="upgradeVolunteer(\''+name+'\', \''+email+'\')" class="btn-floating tooltipped" data-position="left" data-tooltip="Upgrade '+name+' to Ambassador"><i class="material-icons">arrow_upward</i></a></td></tr>';
			}
		}
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
		gdb.collection("volunteers").orderBy("firstName", "asc").get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				// Background fetch complete; hide progress bar
				document.getElementById("tableProgress").style.display = "none";
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired);
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
				buildTableRow(doc.data().firstName + " " + doc.data().lastName, doc.data().email, doc.data().designation, doc.data().dateAcquired);
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
