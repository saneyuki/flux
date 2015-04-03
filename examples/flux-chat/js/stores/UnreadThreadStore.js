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
var MessageStore = require('../stores/MessageStore');
var ThreadStore = require('../stores/ThreadStore');
var Rx = require('rx-lite');

var UnreadThreadStore = {

  getCount: function() {
    var threads = ThreadStore.getAll();
    var unreadCount = 0;
    for (var id in threads) {
      if (!threads[id].lastMessage.isRead) {
        unreadCount++;
      }
    }
    return unreadCount;
  },

  subscribe: function (callback) {
    return Rx.Observable.merge(
          ChatAppDispatcher.clickThread,
          recieveMessageStream
        )
        .map(function (action) {
          return {
            unreadCount: UnreadThreadStore.getCount()
          };
        })
        .subscribe(callback);
  },

};

var recieveMessageStream = Rx.Observable.zipArray(
  ThreadStore.getRecieveMessageStream(),
  MessageStore.getRecieveMessageStream(),
  ChatAppDispatcher.receiveRawMessages
);

module.exports = UnreadThreadStore;
