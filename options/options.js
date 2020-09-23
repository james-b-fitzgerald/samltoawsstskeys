// Saves options to chrome.storage
function save_options() {
  // Get the default filename to be saved
  var DefaultFileName = document.getElementById('DefaultFileName').value;
  
  // Does SessionDuration needs to be applied?
	var ApplySessionDuration = $("#SessionDuration option:selected").val();
	
	// Is DEBUG log enabled?
  var DebugLogs = $("#DebugLogs option:selected").val();

  // Get the role arn/file/sessionDuration tuples entered by the user in the table
  var Roles = {};
  // Iterate over all added roles in the list
  $("input[id^='arn_']").each(function( index ) {  
	  // Replace arne_<rowId> for file_<rowId> and session_duration_<rowId> to be able to get value of corresponding file and session duration input fields
	  var input_id_file = $(this).attr('id').replace("arn", "file");
	  var input_id_session_duration = $(this).attr('id').replace("arn", "session_duration");
	  // Create key-value pair to add to roles dictionary. Value is nested map with file and session duration
	  // Only add it to the dict if all three values are non-empty
	  if ($(this).val() != '' && $('#' + input_id_file).val() != '' && $('#' + input_id_session_duration).val() != '') {
		Roles[$(this).val()] = {"File": $('#' + input_id_file).val(), "SessionDuration": $('#' + input_id_session_duration).val()};
	  }
  });
  
  // Do the actual saving into Chrome storage
  chrome.storage.sync.set({
    DefaultFileName: DefaultFileName,
		ApplySessionDuration: ApplySessionDuration,
		DebugLogs: DebugLogs,
	  Roles: Roles
  }, function() {
    // Show 'Options saved' message to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });

  // Notify background process of changed storage items.
  chrome.runtime.sendMessage({action: "reloadStorageItems"}, function(response) {
    console.log(response.message);
  });
}

// Restores state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
	// Default values
    DefaultFileName: 'credentials',
		ApplySessionDuration: 'yes',
		DebugLogs: 'no',
	  Roles: {}
  }, function(items) {
	// Set filename
    document.getElementById('DefaultFileName').value = items.DefaultFileName;
    // Set ApplySessionDuration
		$("#SessionDuration").val(items.ApplySessionDuration);
		// Set DebugLogs
    $("#DebugLogs").val(items.DebugLogs);
	// Set the html for the Roles Table
	$("#roles").html('<table><tr id="tr_header"><th>Arn</th><th>file</th><th>Session Duration</th><th></th><th></th></tr></table>');
	// For each role add table row (showing the role arn, file, and session duration)
	for (var arn in items.Roles){
		if (items.Roles.hasOwnProperty(arn)) {
			addTableRow('#tr_header', arn, items.Roles[arn]["File"], items.Roles[arn]["SessionDuration"]);
		}
	}
	// Add a blank table row if there are now current entries (So the user can easily add a new role)
	if (Object.keys(items.Roles).length == 0) {
		addTableRow('#roles table tr:last', null, null, null);
	}
  });
}

// Add a blank table row for the user to add a new role
function addTableRow(previousRowJquerySelector, arn, file, sessionDuration) {
	// Generate random identifier for the to be added row
	var newRowId = randomId();
	$(previousRowJquerySelector).after(getTableRowHtml(newRowId, arn, file, sessionDuration));
	// Add eventHandlers for the newly added buttons
	$('#btn_add_' + newRowId).on("click", function() {
		addTableRow('#tr_' + newRowId, null, null, null);
	});
	$('#btn_del_' + newRowId).on("click", function() {
		delTableRow('#tr_' + newRowId);
	});
}

// Remove table row
function delTableRow(tableRowJquerySelector) {
	// Remove table row from the DOM including bound events
	$(tableRowJquerySelector).remove();
}

// Generate HTML for a table row of the roles table
function getTableRowHtml(tableRowId, arn, file, sessionDuration) {
	var arnValue = '';
	var fileValue = '';
	var sessionDurationValue = '';
	// If name, file, and session duration are not NULL, generate HTML value attribute
	if (arn) {arnValue = 'value="' + arn + '"'};
	if (file) {fileValue = 'value="' + file + '"'};
	if (sessionDuration) {sessionDurationValue = 'value="' + sessionDuration + '"'};
	// Generate HTML for the row
	var html =	'<tr id="tr_' + tableRowId + '">\
				<th><input type="text" id="arn_' + tableRowId + '" size="50" ' + arnValue + '></th> \
				<th><input type="text" id="file_' + tableRowId + '" size="18" ' + fileValue + '></th> \
				<th><input type="text" id="session_duration_' + tableRowId + '" size="18" ' + sessionDurationValue + '></th> \
				<th><button id="btn_del_' + tableRowId + '">DEL</button></th> \
				<th><button id="btn_add_' + tableRowId + '">ADD</button></th> \
				</tr>';
	return html;
}

function randomId() {
	return Math.random().toString(36).substr(2, 8);
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);