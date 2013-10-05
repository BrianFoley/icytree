// Global variables
var treeFile = undefined;
var treeData = "";
var trees = [];
var currentTreeIdx = 0;
var controlsHidden = false;
var zoomControl = undefined;
var lineWidth = 2;

// Page initialisation code:
$(document).ready(function() {

    $(window).on("resize", update);

    // Set up drag and drop event listeners:
    $("#output").on("dragover", function(event) {
	event.preventDefault();
	return false;
    });
    $("#output").on("dragend", function(event) {
	event.preventDefault();
	return false;
    });
    $("#output").on("drop", function (event) {
	event.preventDefault();
	treeFile = event.originalEvent.dataTransfer.files[0];
	loadFile();
    });

    // Set up keyboard handler:
    $(document).on("keypress", keyPressHandler);

    // Create new zoomControl object (don't initialise):
    zoomControl = Object.create(ZoomControl, {});

    // Set up dialogs:


    // Set up menus:
    $("#menu > li > button").button();

    $("#fileMenu").menu().hide();
    $("#styleMenu").menu().hide();
    $("#helpMenu").menu().hide();

    $("#menu > li").mouseover(function() {
	$(this).find(".menuDiv > ul").show();
    });

    $("#menu > li").mouseout(function() {
	$(this).find(".menuDiv > ul").hide();
    });

    // Menu item events:

    $("#directEntry").dialog({
	autoOpen: false,
	modal: true,
	width: 500,
	height: 400,
	buttons: {
	    Done: function() {
		treeData = $(this).find("textArea").val();
		reloadTreeData();
		$(this).dialog("close");
	    },
	    Clear: function() {
		$(this).find("textArea").val("");
	    },
	    Cancel: function() {
		$(this).dialog("close");
	    }}
    });
		  
    $("#fileEnter").click(function() {
	$("#directEntry").dialog("open");
    });
    $("#fileLoad").click(function() {
	$("#fileInput").trigger("click");
    });
    $("#fileInput").change(function() {
        treeFile = $("#fileInput").prop("files")[0];
        loadFile();
    });
    $("#fileReload").click(reloadTreeData);
    $("#fileExport").click(exportSVG);

    $("#styleSort").on("click", "a", function() {
	selectListItem($(this));
    });
    $("#styleColourTrait").on("click", "a", function() {
	selectListItem($(this));
    });
    $("#styleTipTextTrait").on("click", "a", function() {
	selectListItem($(this));
    });
    $("#styleNodeTextTrait").on("click", "a", function() {
	selectListItem($(this));
    });
    $("#styleEdgeThickness").on("click", "a", function() {
	if ($(this).text() === "Increase")
	    edgeThicknessChange(1);
	else
	    edgeThicknessChange(-1);
    });

    $("#styleMarkSingletons").click(function() {
	toggleItem($(this));
    });
    $("#styleDisplayAxis").click(function() {
	toggleItem($(this));
    });
    $("#styleAntiAlias").click(function() {
	toggleItem($(this));
    });


    $("#shortcutHelp").dialog({
	autoOpen: false,
	modal: true,
	width: 450,
	buttons: {
	    Ok: function() {
		$(this).dialog("close");
	    }}
    });
    $("#helpShortcuts").click(function() {
	$("#shortcutHelp").dialog("open");
    });

    $("#about").dialog({
	autoOpen: false,
	modal: true,
	width: 450,
	buttons: {
	    Ok: function() {
		$(this).dialog("close");
	    }}
    });
    $("#helpAbout").click(function() {
	$("#about").dialog("open");
    });

    $("#warning").dialog({
	autoOpen: false,
	modal: true,
	width: 450,
	buttons: {
	    "I understand": function() {
		$(this).dialog("close");
	    }}
    });

    update();

    // Display warning if required functions unavailable.
    if (!browserValid()) {
	$("#warning").dialog("open");
    }
});

// Tests for the presence of requried browser functionaility
function browserValid() {
    if (!FileReader)
	return false; // Can't load files.

    return true;
}

// Load tree data from file object treeFile
function loadFile() {
    var reader = new FileReader();
    reader.onload = fileLoaded;
    reader.readAsText(treeFile);

    function fileLoaded(evt) {
	treeData = evt.target.result;
	reloadTreeData();
    }

}

// Display space-filling frame with big text
function displayStartOutput() {

    var output = $("#output");

    output.removeClass();
    output.addClass("empty");
    output.html("");

    output.append(
	$("<img/>")
	    .attr("src", "icytree_start.svg")
	    .attr("height", "150")
    );

    // Pad to centre of page. (Wish I could do this with CSS!)
    var pad = Math.max(Math.floor((window.innerHeight-60-150)/2), 0) + "px";
    output.css("paddingTop", pad);
    output.css("paddingBottom", pad);

}

function displayLoading() {

    var output = $("#output");

    output.removeClass();
    output.addClass("text");
    output.text("Loading...");

    // Pad to centre of page. (Wish I could do this with CSS!)
    var pad = Math.max(Math.floor((window.innerHeight-60-100)/2), 0) + "px";
    output.css("paddingTop", pad);
    output.css("paddingBottom", pad);
}

function displayError(string) {

    var output = $("#output");

    output.removeClass();
    output.addClass("error");
    output.text(string);

    // Pad to centre of page. (Wish I could do this with CSS!)
    var pad = Math.max(Math.floor((window.innerHeight-60-100)/2), 0) + "px";
    output.css("paddingTop", pad);
    output.css("paddingBottom", pad);

    setTimeout(function() {
	displayStartOutput();
    }, 4000);
}

// Clear all output element styles.
function prepareOutputForTree() {
    var output = $("#output");
    output.removeClass();
    output.css("padding", "0px");
}

// Update checked item in list:
function selectListItem(el) {

    // el is an <a> within the <li>
    var li = el.parent();
    var ul = li.parent();

    if (el.find("span").length>0)
	return;

    // Uncheck old selected element:
    ul.find("span").remove();

    // Check this element:
    $("<span/>").addClass("ui-icon ui-icon-check").prependTo(el);

    // Update
    update();
}

// Cycle checked item in list:
function cycleListItem(el) {

    // el is <ul>
    var currentItem = el.find("span").closest("li");
    if (currentItem.is(el.find("li").last()))
	selectListItem(el.find("li").first().children());
    else
	selectListItem(currentItem.next().children());
}

function toggleItem (el) {
    if (el.find("span").length===0) {
	el.prepend($("<span/>").addClass("ui-icon ui-icon-check"));
    } else {
	el.find("span").remove();
    }
    
    update();
}

// Update form elements containing trait selectors
function updateTraitSelectors(tree) {
    
    var elements = [$("#styleColourTrait"),
		    $("#styleTipTextTrait"),
		    $("#styleNodeTextTrait")];

    $.each(elements, function (eidx, el) {
	
        // Save currently selected trait:
        var selectedTrait =  el.find("span").parent().text();
	
        // Clear old traits:
        el.html("");
	
        // Selector-dependent stuff:
	// Colour selector only allows traits common to _all_ nodes on tree.
	// All other selectors include the node label as an option.

	var traitList = ["None"];
        if (el.is("#styleColourTrait")){
	    traitList = traitList.concat(tree.getTraitList(true));

	} else {
	    traitList.push("Node label");
	    traitList = traitList.concat(tree.getTraitList(false));
        }

	// Construct selector trait lists:
        for (var i=0; i<traitList.length; i++) {
            var selector = $("<li />");
	    var a = $("<a/>").attr("href","#").text(traitList[i]);
	    selector.append(a);
	    if (traitList[i] === selectedTrait)
		$("<span/>").addClass("ui-icon ui-icon-check").prependTo(a);
	    el.append(selector);
        }
	
    });

    $("#styleMenu").menu("refresh");
}

// Alter line width used in visualisation.
function edgeThicknessChange(inc) {
    lineWidth = Math.max(1, lineWidth + inc);
    update();
}

// Increment currently-displayed tree.
function currentTreeInc(dir, big) {
    if (big)
	inc = dir*Math.round(trees.length/10)
    else
	inc = dir;
   
    currentTreeIdx = Math.max(0, currentTreeIdx+inc);
    currentTreeIdx = Math.min(trees.length-1, currentTreeIdx);

    update();
}

// Alter currently-displayed tree.
function currentTreeChange(newVal) {
    newVal = Number(newVal);
    if (String(newVal) === "NaN") {
	updateCurrentTreeControl();
	return;
    }
	
    currentTreeIdx = Math.max(0, Number(newVal)-1);
    currentTreeIdx = Math.min(trees.length-1, currentTreeIdx);

    update();
}

// Ensure current tree index is within bounds,
// keeps "spin control" up to date and alters
// visibility of control depending on number of
// trees in current list.
function updateCurrentTreeControl() {

    if (currentTreeIdx>trees.length-1)
	currentTreeIdx = trees.length-1;
    else if (currentTreeIdx<0)
	currentTreeIdx = 0;

    if (currentTreeIdx<=0) {
	document.getElementById("prevTree").disabled = true;
	document.getElementById("firstTree").disabled = true;
    } else {
	document.getElementById("prevTree").disabled = false;
	document.getElementById("firstTree").disabled = false;
    }

    if (currentTreeIdx>=trees.length-1) {
	document.getElementById("nextTree").disabled = true;
	document.getElementById("lastTree").disabled = true;
    } else {
	document.getElementById("nextTree").disabled = false;
	document.getElementById("lastTree").disabled = false;
    }

    var selectEl = document.getElementById("treeSelect");
    var counterEl = document.getElementById("treeCounter");

    if (trees.length>1) {
	selectEl.style.display = "block";
	counterEl.textContent = "Tree number: " +
	(currentTreeIdx+1) + " of " + trees.length;

	var setTreeEl = document.getElementById("setTree");
	setTreeEl.value = currentTreeIdx+1;
	setTreeEl.size = String(trees.length).length;
    } else {
	selectEl.style.display = "none";
    }
}

// Update object representation of tree data from string
function reloadTreeData() {

    if (treeData.replace(/\s+/g,"").length === 0) {
        trees = [];
	update();
	return;
    }

    treeData = treeData.replace(/&amp;/g,"&");

    if (treeData.length>500000) {

	// Parse large data set asynchronously and display loading screen
	
	displayLoading();

	setTimeout(function() {

	    try {
		trees = getTreesFromString(treeData);
	    } catch (e) {
		displayError("Error parsing tree data!");
		console.log(e);
		return;
	    }
	    
	    console.log("Successfully parsed " + trees.length + " trees.");
	    update();
	}, 300);
    } else {

	// Parse small data set NOW. (No loading screen.)

	try {
	    trees = getTreesFromString(treeData);
	} catch (e) {
	    displayError("Error parsing tree data!");
	    console.log(e);
	    return;
	}
	    
	console.log("Successfully parsed " + trees.length + " trees.");
	update();
    }
}

// Converts SVG in output element to data URI for saving
function exportSVG() {
    if (currentTreeIdx>=trees.length || currentTreeIdx<0)
	return false;

    var dataURI = "data:image/svg+xml;base64," + window.btoa($("#output").html());
    window.open(dataURI);
}

// Update display according to current tree model and display settings
function update() {

    // Update tree index selector:
    updateCurrentTreeControl();

    if (trees.length === 0) {
	displayStartOutput();
	return;
    } else {
	prepareOutputForTree();
    }

    // Generate _copy_ of tree to draw.
    // (Allows us to revert sorting operation.)
    var tree = trees[currentTreeIdx].copy();

    // Sort tree nodes
    switch ($("#styleSort span").parent().text()) {
    case "Ascending":
        tree.sortNodes(false);
	break;
    case "Descending":
        tree.sortNodes(true);
	break;
    default:
	break;
    }

    // Update trait selectors:
    updateTraitSelectors(tree);
    
    // Determine whether colouring is required:
    var colourTrait = $("#styleColourTrait span").parent().text();
    if (colourTrait === "None")
	colourTrait = undefined;
    
    // Determine whether tip labels are required:
    var tipTextTrait = $("#styleTipTextTrait span").parent().text();
    switch (tipTextTrait) {
    case "None":
	tipTextTrait = undefined;
	break;
    case "Node label":
	tipTextTrait = "label";
	break;
    default:
	break;
    }

    // Determine whether internal node labels are required:
    var nodeTextTrait = $("#styleNodeTextTrait span").parent().text();
    switch (nodeTextTrait) {
    case "None":
	nodeTextTrait = undefined;
	break;
    case "Node label":
	nodeTextTrait = "label";
	break;
    default:
	break;
    }

    // Create layout object:
    var layout = Object.create(Layout).init(tree).standard();
    
    // Assign chosen layout properties:
    layout.width = Math.max(window.innerWidth-5, 200);
    layout.height = Math.max(window.innerHeight-5, 200);
    layout.colourTrait = colourTrait;
    layout.tipTextTrait = tipTextTrait;
    layout.nodeTextTrait = nodeTextTrait;
    layout.markSingletonNodes = ($("#styleMarkSingletons > span").length>0);
    layout.axis = ($("#styleDisplayAxis > span").length>0);
    layout.lineWidth = lineWidth;

    // Use existing zoom control instance:
    layout.zoomControl = zoomControl;

    // Display!
    $("#output").html("");
    var svg = layout.display();
    svg.setAttribute("id", "SVG");
    if ($("#styleAntiAlias > span").length==0)
	svg.style.shapeRendering = "crispEdges";
    $("#output").append(svg);
}

// Keyboard event handler:
function keyPressHandler(event) {

    if (event.target !== document.body)
	return;

    var char = String.fromCharCode(event.charCode);

    if (char == "?") {
	// Keyboard shortcut help
	$("#shortcutHelp").dialog("open");
    }

    if (trees.length == 0)
	return;

    switch(char) {
    case "r":
	// Reload:
	loadFile();
	break;

    case "t":
	// Cycle tip text:
	cycleListItem($("#styleTipTextTrait"));
	break;

    case "i":
	// Cycle internal node text:
	cycleListItem($("#styleNodeTextTrait"));
	break;

    case "c":
	// Cycle branch colour:
	cycleListItem($("#styleColourTrait"));
	break;

    case "m":
	// Toggle marking of internal nodes:
	toggleItem($("#styleMarkSingletons"));
	break;

    case "a":
	// Toggle axis display
	toggleItem($("#styleDisplayAxis"));
	break;

    case "z":
	// Reset zoom.
	zoomControl.reset();
	break;

    case ".":
	// Next tree
	currentTreeInc(1, false);
	break;

    case ",":
	// Prev tree
	currentTreeInc(-1, false);
	break;

    case ">":
	// Fast-forward tree 
	currentTreeInc(1, true);
	break;

    case "<":
	// Fast-backward tree
	currentTreeInc(-1, true);
	break;

    case "+":
    case "=":
	// Increase line thickness
	edgeThicknessChange(1);
	break;

    case "-":
	// Decrease line thickness
	edgeThicknessChange(-1);
	break;

    default:
	break;
    }
}


