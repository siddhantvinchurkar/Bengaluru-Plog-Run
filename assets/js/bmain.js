/* Global Variables */
var communityArray = [];

window.onload = function(){

		// Set footer year
		document.getElementById("footerYear").innerHTML = new Date().getFullYear();

		// Handle mouse over event for header logo
		document.getElementById("header-logo").onmouseover = function(){
			document.getElementById("header-logo").src = "../images/orange-logo.svg";
		}
		document.getElementById("header-logo").onmouseout = function(){
			document.getElementById("header-logo").src = "../images/logo.svg";
		}
	}

		// Handle data from the Google Spreadsheet
		function communityData(data){
			// Convert data to JSON and filter out unrequired stuff
			data = data.feed.entry;
			for(var i=0; i<data.length; i+=3){
				buildCard(data[i].content.$t, data[i+1].content.$t, data[i+2].content.$t);
			}
			for(var i=0; i<communityArray.length; i++)document.getElementById("cardContainer").innerHTML += communityArray[i];
			document.getElementById("loader").style.display = "none";
		}

// Card Builder
function buildCard(name, description, photoUrl){

	// Escape single quotes before use
	name = name.replace(/'/g, "\\'");
	description = description.replace(/'/g, "\\'");
	photoUrl = photoUrl.replace(/'/g, "\\'");

	// Create array
	communityArray.push('<div class="at-column"><div class="at-user"><div class="at-user__avatar"><img src="'+photoUrl+'" /></div><div class="at-user__name">'+name+'</div><div class="at-user__location">'+description+'</div></div></div>');
}
