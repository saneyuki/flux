/**
 * This file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var ChatAppDispatcher = require('../dispatcher/ChatAppDispatcher');
var ChatMessageUtils = require('../utils/ChatMessageUtils');
var ThreadStore = require('../stores/ThreadStore');
var Rx = require('rx-lite');

var _messages = {};

function _addMessages(rawMessages) {
  rawMessages.forEach(function(message) {
    if (!_messages[message.id]) {
      _messages[message.id] = ChatMessageUtils.convertRawMessage(
        message,
        ThreadStore.getCurrentID()
      );
    }
  });
}

function _markAllInThreadRead(threadID) {
  for (var id in _messages) {
    if (_messages[id].threadID === threadID) {
      _messages[id].isRead = true;
    }
  }
}

var MessageStore = {

  get: function(id) {
    return _messages[id];
  },

  getAll: function() {
    return _messages;
  },

  /**
   * @param {string} threadID
   */
  getAllForThread: function(threadID) {
    var threadMessages = [];
    for (var id in _messages) {
      if (_messages[id].threadID === threadID) {
        threadMessages.push(_messages[id]);
      }
    }
    threadMessages.sort(function(a, b) {
      if (a.date < b.date) {
        return -1;
      } else if (a.date > b.date) {
        return 1;
      }
      return 0;
    });
    return threadMessages;
  },

  getAllForCurrentThread: function() {
    return this.getAllForThread(ThreadStore.getCurrentID());
  },

  getRecieveMessageStream: function () {
    return recieveMessageStream;
  },

  subscribe: function (callback) {
    return Rx.Observable.merge([
      createMessageStream,
      clickThreadStream,
      recieveMessageStream
    ]).map(function(action){
      return {
        messages: MessageStore.getAllForCurrentThread(),
      };
    }).subscribe(callback);
  },

};

var createMessageStream = ChatAppDispatcher.createMessage.map(function(action){
  var message = ChatMessageUtils.getCreatedMessageData(
      action.text,
      action.currentThreadID
      );
  _messages[message.id] = message;
  return action;
});

var clickThreadStream = Rx.Observable.zipArray(
    ChatAppDispatcher.clickThread,
    ThreadStore.getClickThreadStream()
).map(function () {
  _markAllInThreadRead(ThreadStore.getCurrentID());
  return;
});

var recieveMessageStream = ChatAppDispatcher.receiveRawMessages.map(function (action) {
  _addMessages(action.rawMessages);
  return action;
})
.flatMap(function(action) {
  return ThreadStore.getRecieveMessageStream();
})
.map(function(){
  _markAllInThreadRead(ThreadStore.getCurrentID());
});

Rx.Observable.merge([
  createMessageStream,
  clickThreadStream,
  recieveMessageStream
]).subscribe(function(action){});

module.exports = MessageStore;
