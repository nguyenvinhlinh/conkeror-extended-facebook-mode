/* conkeror-extended-facebook-mode
   Conkeror Extended Facebook Mode
*/

////////////////////////////////////////////////////////////////////////////////
// Include library
require("facebook"); // the default Conkeror's Facebook mode

// Avoid polluting global variables
var cefm = {};

////////////////////////////////////////////////////////////////////////////////
// Fallthrough keys for Facebook shortcut keys
define_key(facebook_keymap, "j", null, $fallthrough);
define_key(facebook_keymap, "k", null, $fallthrough);
define_key(facebook_keymap, "return", null, $fallthrough);
define_key(facebook_keymap, "q", null, $fallthrough);
define_key(facebook_keymap, "/", null, $fallthrough);
define_key(facebook_keymap, "l", null, $fallthrough);
define_key(facebook_keymap, "m", null, $fallthrough);
define_key(facebook_keymap, "c", null, $fallthrough);
define_key(facebook_keymap, "p", null, $fallthrough);
define_key(facebook_keymap, "o", null, $fallthrough);

////////////////////////////////////////////////////////////////////////////////
// Variables used
// Selectors
cefm.selectors = {};
// Selected story
cefm.selectors.selectedStory = [".selectedStorySimple", "._5gxh", "._5qdv"];
// Story links
cefm.selectors.storyLink = [
  "a._5pcq", ".uiStreamSource>a", ".UFIBlingBox.uiBlingBox.feedbackBling",
  ".fcg>a", ".fwb a"
];
// Buttons
cefm.selectors.friendRequestButton = "#fbRequestsJewel>a.jewelButton";
cefm.selectors.messagesButton = "._1z4y>.jewelButton";
cefm.selectors.notificationButton = "._4xi2>.jewelButton";
cefm.selectors.homeButton = "._2pdh>._1ayn";
cefm.selectors.profileButton = "._4fn6>._1ayn";
cefm.selectors.logoutButton = "#logout_form>label>input";
// Messages
cefm.selectors.focusedConversation = '.fbNub._50mz._50-v.focusedTab';
// Chat conversation
cefm.selectors.openedConversation = '.fbNub._50mz._50-v.opened';
cefm.selectors.conversationTextarea = '._552m';
cefm.selectors.selectImageButton = "._5f0v";

// Regex
cefm.regex = {};
// Story link format
cefm.regex.storyLink = [
  // https://www.facebook.com/photo.php?fbid=681522898533972&set=a.451364638216467.109262.100000288032725&type=1
  new RegExp("^[A-Za-z0-9:/.]+(facebook.com/photo.php)[A-Za-z0-9?=.&/_]+$"),
  // https://www.facebook.com/candycandy198/posts/273678246115411?stream_ref=1
  new RegExp("^[A-Za-z0-9:/.]+(facebook.com/)[A-Za-z0-9.]+(/posts/)[A-Za-z0-9:./?_=]+$"),
  // https://www.facebook.com/groups/377906112324180/permalink/482710721843718/
  new RegExp("^[A-Za-z0-9:/.]+(facebook.com/groups/)[A-Za-z0-9.]+(/permalink/)[A-Za-z0-9./]+$"),
  // https://www.facebook.com/media/set/?set=a.714473798592597.1073741843.100000899501161&type=1
  new RegExp("^[A-Za-z0-9:/.]+(facebook.com/media/set)/[A-Za-z0-9?.=/&]+$"),
  // https://www.facebook.com/permalink.php?story_fbid=afjslkjks
  new RegExp("^[A-Za-z0-9:/.]+(facebook.com/permalink.php)[A-Za-z0-9_?=/&]+$"),
	// https://www.facebook.com/emilyosment10392/activity/3489815221361
	new RegExp("^[A-Za-z0-9:/.]+(facebook.com/)[A-Za-z0-9.]+(/activity/)[A-Za-z0-9:./]+$"),
	// https://www.facebook.com/TapChiChimLon/photos/a.173301119366880.49325/729867413710245/?type=1
	new RegExp("^[A-Za-z0-9:/.]+(facebook.com/)[A-Za-z0-9.]+(/photos)[A-Za-z0-9?=.&/_]+$"),
	// https://www.facebook.com/groups/243388739045691/permalink/735257363192157/?stream_ref=1
	new RegExp("^[A-Za-z0-9:/.]+(facebook.com/groups/)[A-Za-z0-9.]+(/permalink/)[A-Za-z0-9?=.&/_]+$"),
];

// Messages
cefm.messages = {};
cefm.messages.storyLinkNotFound = "Cannot find story link";
cefm.messages.noSelectedStory = "No selected story. Press j k to traverse story";
cefm.messages.expandElementNotFound = "Cannot find any expand element";
cefm.messages.noActiveConversation = 'No conversation opened. Press q to start chatting';
cefm.messages.noFocusedConversation = "No focused conversation. Focus on one conversation first";
cefm.messages.selectImageButtonNotFound = "Cannot find Select Image button";

var cefm_conversation_not_found_message
  = "Cannot find conversation div";
var cefm_no_active_conversation_message
  = "No active conversations. Press q to find a friend to chat.";
var cefm_no_focused_conversation_message
  = "No focused conversation. Focus on one conversation first";
var cefm_scroll_gap = 50;

// Button Names
cefm.buttonNames = {};
cefm.buttonNames.friendRequest = "Friend Request";
cefm.buttonNames.messages = "Messages";
cefm.buttonNames.notification = "Notification";
cefm.buttonNames.home = "Home";
cefm.buttonNames.profile = "Profile";
cefm.buttonNames.logout = "Logout";

////////////////////////////////////////////////////////////////////////////////
// Some functions needed for the mode
/**
 * Click on the button with the input css selector
 * @param selector - The css selector of the button
 * @param button_name - The name of the button, can be any name that you like
 * @param I - The I object of the interactive command
 */
cefm.clickButton = function (I, selector, buttonName){
  var document = I.buffer.document;
  var button = document.querySelector(selector);
  if (button !== null) {
	  dom_node_click(button);
    I.minibuffer.message("Button " + buttonName + " clicked");
  } else {
	  I.minibuffer.message("Cannot find " + buttonName + " button");
  }
};

/**
 * Check if the focus is on any conversations or not
 * @param document - The document object of the current buffer (I.buffer.document)
 */
cefm.isFocusOnConversation = function (I){
  var document = I.buffer.document;
  var focusedConversation = document.querySelector(cefm.selectors.focusedConversation);
  if(focusedConversation !== null){
	  return true;
  } else {
	  return false;
  }
};

cefm.findFocusedConversation = function(I) {
  var document = I.buffer.document;
  var focusedConversation = document.querySelector(cefm.selectors.focusedConversation);
  return focusedConversation;
};

/**
 * Finding the conversation <div> that is nth-level parent of the active element
 * @param document - The document object of the current buffer (I.buffer.document)
 * @return Returns the conversation <div> object if it's found, otherwise, returns null
 */
function cefm_find_conversation_div(document){
  var activeElement = document.activeElement;
  // find the conversation div that is nth-level parent of the active element
  var p = activeElement.parentNode;
  while(p!=document){
	  if(p.classList.contains("_50-v")
	     && p.classList.contains("fbNub")
	     && p.classList.contains("_50mz")){
	    break;
	  } else {
	    p = p.parentNode;
	  }
  }
  // check if it can find
  if(p == document){
	  return null;
  } else {
	  return p;
  }
}

/**
 * Find the conversation <div> arrays (all the conversation <div> inside the page)
 * @param document - The document object of the current buffer (I.buffer.document)
 * @return Returns the conversation <div> array there are any conversation <div> exists, otherwise, returns null
 */
function cefm_find_conversation_div_array(document){
  var conversationDiv = document.querySelectorAll("._50-v.fbNub._50mz");
  if(conversationDiv.length == 0){
	  return null;
  } else {
	  return conversationDiv;
  }
}

/**
 * Find the <textarea> array that contains all the <textarea>s inside the conversation <div>
 * @param document - The document object of the current buffer (I.buffer.document)
 */
function cefm_find_conversation_textarea_array(document){
  return document.querySelectorAll("._552m");
}

/**
 * Cycle through conversations
 * if there is no active conversation, tell the user to open, otherwise, find the
 * right one to focus
 * if not focus on any conversation, focus on the first one
 * otherwise, focus on the next one, if this is the last one, focus back on
 * the first one
 * @param I - The I object of the interactive command
 */
cefm.cycleConversations = function(I) {
  var document = I.buffer.document;

  // get all the opened conversation divs
  var conversationDivs = document.querySelectorAll(cefm.selectors.openedConversation);

  // if no active conversation
  if(conversationDivs.length === 0) {
    I.minibuffer.message(cefm.messages.noActiveConversation);
  } else {
    // if not focus on any conversation
    if(!cefm.isFocusOnConversation(I)) {
      // focus the first one
      focusTextarea(conversationDivs[0]);
    } else {
      // if the focus is one the last one
      var focusedConversation = cefm.findFocusedConversation(I);
      if(focusedConversation === conversationDivs[conversationDivs.length - 1]) {
        // focus on the first one
        focusTextarea(conversationDivs[0]);
      } else {
        // focus one the next one
        // find the current index of the focused one
        var currentIndex;
        for(var i = 0; i < conversationDivs.length; i++) {
          if(focusedConversation === conversationDivs[i])
            currentIndex = i;
        }
        focusTextarea(conversationDivs[currentIndex + 1]);
      }
    }
  }

  function focusTextarea(conversationDiv) {
    var textarea = conversationDiv.querySelector(cefm.selectors.conversationTextarea);
    textarea.focus();
  }
};

/**
 * Attach Image to the current conversation
 * @param I - The I object of the interactive command
 */
cefm.attachImageToConversation = function(I){
  var document = I.buffer.document;

  // find the focused conversation
  var focusedConversation = cefm.findFocusedConversation(I);

  if(focusedConversation === null) {
    I.minibuffer.message(cefm.messages.noFocusedConversation);
  } else {
    // find the select image button and click on it
    var selectImageButton = focusedConversation.querySelector(cefm.selectors.selectImageButton);
    if(selectImageButton === null) {
      I.minibuffer.message(cefm.messages.selectImageButtonNotFound);
    } else {
      dom_node_click(selectImageButton);
    }
  }
};

/**
 * Scroll current chat conversation
 * @param I - The I object of the interactive command
 * @param scroll_gap - The gap to scroll (positive for down, negative for scroll up)
 */
function cefm_scroll_current_conversation(I, scroll_gap){
  // get the document buffer
  var document = I.buffer.document;

  // query the div(s) that contain the chat conversations and the textareas for
  // typing chat message
  var conversationDiv;
  var conversationTextareas = cefm_find_conversation_textarea_array(document);

  // check if there are any active conversations
  if((conversationDiv = cefm_find_conversation_div_array(document)) != null){
	  // check if the focus is on any conversation or not
	  if(cefm.isFocusOnConversation(I)){
	    // find the conversation div that is nth-level parent of the active
	    // element
	    var p;
	    if((p = cefm_find_conversation_div(document)) == null){
		    I.minibuffer.message(cefm_conversation_not_found_message);
	    } else {
		    // query the body of the chat (the scrollable part)
		    var chat_body = p.querySelector(".fbNubFlyoutBody");
		    // scroll to top
		    chat_body.scrollTop = chat_body.scrollTop + scroll_gap;
	    }
	  } else {
	    I.minibuffer.message(cefm_no_focused_conversation_message);
	  }
  } else {
	  I.minibuffer.message(cefm_no_active_conversation_message);
  }  
}

/**
 * Scroll current chat conversation up
 * @param I - The I object of the interactive command
 */
function cefm_scroll_current_conversation_up(I){
  cefm_scroll_current_conversation(I, 0 - cefm_scroll_gap);
}

/**
 * Scroll current chat conversation down
 * @param I - The I object of the interactive command
 */
function cefm_scroll_current_conversation_down(I){
  cefm_scroll_current_conversation(I, cefm_scroll_gap);
}

/**
 * Find the selected story
 * @param document - The document object of the current buffer (I.buffer.document)
 * @return Returns the selected story div object if found, otherwise, returns null
 */
cefm.findSelectedStory = function (I){
  var document = I.buffer.document;
  var selectedStory = null;
  var selectedStorySelectors = cefm.selectors.selectedStory;
  selectedStorySelectors.forEach(function(selector){
    var story = document.querySelector(selector);
    if(story !== null) selectedStory = story;
  });
  
  return selectedStory;
};

/**
 * Inspect and find the link of selected story
 * @param I - The I object of the interactive command
 * @param open_url_func - The function for opening the url
 */
cefm.openSelectedStoryLink = function (I, openUrlFunction){
  // get the document
  var document = I.buffer.document;
  var storyLinks = [];
  var selectedStory = cefm.findSelectedStory(I);
  var regexes = cefm.regex.storyLink;

  // check if the selected story exists

  if(selectedStory !== null){
    // query all the possible potential story links
    cefm.selectors.storyLink.forEach(function(selector){
      var links = selectedStory.querySelectorAll(selector);
      for(var i = 0; i < links.length; i++) {
        storyLinks.push(links[0]);
      }
    });

  	// check if there is any story link matches the regex
  	var match = false;
  	for(var i = 0; i < storyLinks.length; i++){
  	  // check if the current link match the regex
  	  match = false;
  	  for(var j = 0; j < regexes.length; j++){
  	  	if(regexes[j].test(storyLinks[i])){
  	  	  match = true;
  	  	  break;
  	  	}
  	  }
  	  if(match){
  	  	openUrlFunction(storyLinks[i], I.window);
  	  	break;
  	  }
  	}
    
  	if(!match){
  	  I.minibuffer.message(cefm.messages.storyLinkNotFound);
  	}
  } else {
  	I.minibuffer.message(cefm.messages.noSelectedStory);
  }
};

/**
 * Expand the content of the selected story if exists, otherwise, expand the
 * first one found 
 * @param I - The I object of the interactive command
 */
cefm.expandStory = function (I){
  var selectedStory = null;
  var document = I.buffer.document;
  var expandParent = null;
  var expandElement = null;

  // check if the selected story exists
  if((selectedStory = cefm.findSelectedStory(I)) !== null){
	  expandParent = selectedStory;
  } else {
	  expandParent = document;
  }

  // find the expand element to click on
  if((expandElement = expandParent.querySelector(".text_exposed_link>a")) !== null){
	  dom_node_click(expandElement);
  } else {
	  I.minibuffer.message(cefm.messages.expandElementNotFound);
  }
};

// check if the fbJewel panel (Friend Requests, Messages, Notifications,...) is
// currently closed or opened
// panelSelector: the selector of the panel div tag (usually "#fbMessagesFlyout",
// "#fbNotificationsFlyout", "#fbRequestsFlyout")
// I: the I object of the interactive command
cefm.isJewelPanelOpen = function (I, panelSelector){
  var doc = I.buffer.document;

  var element = doc.querySelector(panelSelector);
  if(element === null){
	  return false;
  } else {
	  if(element.classList.contains("toggleTargetClosed")){
	    return false;
	  } else {
	    return true;
	  }
  }
};

// browser object classes link for notification, friend requests and messages
define_browser_object_class("facebook-notification-links", null,
							              xpath_browser_object_handler("//a[@class='_33e']"),
							              $hint = "select notification");

define_browser_object_class("facebook-messages-links", null,
							              xpath_browser_object_handler("//a[@class='messagesContent']"),
							              $hint = "select notification");

////////////////////////////////////////////////////////////////////////////////
// Interactive Commands
interactive("cefm-open-friend-request",
			      "Open Facebook Friend Requests panel", function(I){
			        cefm.clickButton(I, cefm.selectors.friendRequestButton, cefm.buttonNames.friendRequest);
			      });

interactive("cefm-open-messages",
			      "Open Facebook Messages panel", function(I){
			        cefm.clickButton(I, cefm.selectors.messagesButton, cefm.buttonNames.messages);
			      });

interactive("cefm-open-notification",
			      "Open Facebook Notification panel", function(I){
			        cefm.clickButton(I, cefm.selectors.notificationButton, cefm.buttonNames.notification);
			      });

interactive("cefm-open-home",
			      "Open Facebook Home page", function(I){
			        cefm.clickButton(I, cefm.selectors.homeButton, cefm.buttonNames.home);
			      });

interactive("cefm-open-profile",
			      "Open Facebook Profile page", function(I){
			        cefm.clickButton(I, cefm.selectors.profileButton, cefm.buttonNames.profile);
			      });

interactive("cefm-quick-logout",
			      "Quickly logout from Facebook", function(I){
			        cefm.clickButton(I, cefm.selectors.logoutButton, cefm.buttonNames.logout);
			      });

interactive("cefm-open-current-story-new-buffer",
			      "Open selected story in new buffer", function (I) {
			        cefm.openSelectedStoryLink(I, load_url_in_new_buffer);
			      });

interactive("cefm-open-current-story-new-buffer-background",
			      "Open selected story in new buffer background", function (I) {
			        cefm.openSelectedStoryLink(I, load_url_in_new_buffer_background);
			      });

interactive("cefm-scroll-up-current-conversation",
			      "Scroll the current conversation up", function(I){
			        cefm_scroll_current_conversation_up(I);
			      });

interactive("cefm-scroll-down-current-conversation",
			      "Scroll the current conversation down", function(I){
			        cefm_scroll_current_conversation_down(I);
			      });

interactive("cefm-attach-image",
			      "Open selected story in new buffer", function (I) {
			        cefm.attachImageToConversation(I);
			      });

interactive("cefm-cycle-conversations",
			      "Cycle through chat conversations", function(I){
			        cefm.cycleConversations(I);
			      });

interactive("cefm-expand-content",
			      "Expand the content of the selected story or the caption of the current photo", function(I){
			        cefm.expandStory(I);
			      });

interactive("cefm-follow-notifications", "Follow notification links", function(I){
  if(!cefm.isJewelPanelOpen(I, "#fbNotificationsFlyout"))
	  cefm.clickButton(I, "#fbNotificationsJewel>a.jewelButton", "Notification");
  var element = yield read_browser_object(I);
  try {
    element = load_spec(element);
    if (I.forced_charset)
      element.forced_charset = I.forced_charset;
  } catch (e) {}
  browser_object_follow(I.buffer, FOLLOW_DEFAULT, element);
}, $browser_object = browser_object_facebook_notification_links);

interactive("cefm-follow-notifications-new-buffer", "Follow notification links in new buffer", function(I){
  if(!cefm.isJewelPanelOpen(I, "#fbNotificationsFlyout"))
	  cefm.clickButton(I, "#fbNotificationsJewel>a.jewelButton", "Notification");
  var element = yield read_browser_object(I);
  try {
    element = load_spec(element);
    if (I.forced_charset)
      element.forced_charset = I.forced_charset;
  } catch (e) {}
  browser_object_follow(I.buffer, OPEN_NEW_BUFFER, element);
}, $browser_object = browser_object_facebook_notification_links);

interactive("cefm-follow-notifications-new-buffer-background",
			      "Follow notification links in new buffer background", function(I){
			        if(!cefm.isJewelPanelOpen(I, "#fbNotificationsFlyout"))
				        cefm.clickButton(I, "#fbNotificationsJewel>a.jewelButton", "Notification");
			        var element = yield read_browser_object(I);
			        try {
				        element = load_spec(element);
				        if (I.forced_charset)
				          element.forced_charset = I.forced_charset;
			        } catch (e) {}
			        browser_object_follow(I.buffer, OPEN_NEW_BUFFER_BACKGROUND, element);
			      }, $browser_object = browser_object_facebook_notification_links);

interactive("cefm-follow-messages", "Follow messages conversation", function(I){
  if(!cefm.isJewelPanelOpen(I, "#fbMessagesFlyout"))
	  cefm.clickButton(I, "#fbMessagesJewel>a.jewelButton", "Messages");
  var element = yield read_browser_object(I);
  try {
    element = load_spec(element);
    if (I.forced_charset)
      element.forced_charset = I.forced_charset;
  } catch (e) {}
  browser_object_follow(I.buffer, FOLLOW_DEFAULT, element);
}, $browser_object = browser_object_facebook_messages_links);

interactive("cefm-follow-multiple-notifications", "",
		        function(I){
			        var a = yield I.minibuffer.read($prompt = "Number of notifications to open: ");
			        if(isNaN(a)){
			          I.minibuffer.message("Please input a number!");
			        } else {
			          a = parseInt(a);
			          
			        }
		        });

provide("conkeror-extended-facebook-mode");
