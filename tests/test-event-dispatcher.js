/**
 * Test script for EventDispatcher
 * Run with: node test-event-dispatcher.js
 */

import { EventDispatcher } from './src/event-dispatcher.js';

console.log('🧪 Testing EventDispatcher...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test 1: Basic on/trigger
test('Basic on/trigger', () => {
  const dispatcher = new EventDispatcher();
  let called = false;
  let receivedArg = null;

  dispatcher.on('test', (arg) => {
    called = true;
    receivedArg = arg;
  });

  dispatcher.trigger('test', 'hello');

  assert(called, 'Callback should be called');
  assert(receivedArg === 'hello', 'Argument should be passed');
});

// Test 2: Multiple arguments
test('Multiple arguments', () => {
  const dispatcher = new EventDispatcher();
  let arg1, arg2, arg3;

  dispatcher.on('test', (a, b, c) => {
    arg1 = a;
    arg2 = b;
    arg3 = c;
  });

  dispatcher.trigger('test', 1, 2, 3);

  assert(arg1 === 1 && arg2 === 2 && arg3 === 3, 'Multiple arguments should be passed');
});

// Test 3: Space-separated events
test('Space-separated events', () => {
  const dispatcher = new EventDispatcher();
  let count = 0;

  dispatcher.on('event1 event2 event3', () => {
    count++;
  });

  dispatcher.trigger('event1');
  dispatcher.trigger('event2');
  dispatcher.trigger('event3');

  assert(count === 3, 'All space-separated events should trigger');
});

// Test 4: Context binding
test('Context binding', () => {
  const dispatcher = new EventDispatcher();
  const context = { value: 42 };
  let receivedContext = null;

  dispatcher.on('test', function() {
    receivedContext = this;
  }, context);

  dispatcher.trigger('test');

  assert(receivedContext === context, 'Context should be bound');
  assert(receivedContext.value === 42, 'Context should have correct value');
});

// Test 5: off() - remove all listeners
test('off() - remove all', () => {
  const dispatcher = new EventDispatcher();
  let count = 0;

  dispatcher.on('test', () => count++);
  dispatcher.trigger('test');
  assert(count === 1, 'First trigger should work');

  dispatcher.off();
  dispatcher.trigger('test');
  assert(count === 1, 'After off(), trigger should not call callback');
});

// Test 6: off(event) - remove event listeners
test('off(event) - remove specific event', () => {
  const dispatcher = new EventDispatcher();
  let count1 = 0;
  let count2 = 0;

  dispatcher.on('event1', () => count1++);
  dispatcher.on('event2', () => count2++);

  dispatcher.trigger('event1 event2');
  assert(count1 === 1 && count2 === 1, 'Both events should trigger');

  dispatcher.off('event1');
  dispatcher.trigger('event1 event2');
  assert(count1 === 1 && count2 === 2, 'Only event2 should trigger after off');
});

// Test 7: off(event, callback) - remove specific callback
test('off(event, callback) - remove specific callback', () => {
  const dispatcher = new EventDispatcher();
  let count1 = 0;
  let count2 = 0;

  const callback1 = () => count1++;
  const callback2 = () => count2++;

  dispatcher.on('test', callback1);
  dispatcher.on('test', callback2);

  dispatcher.trigger('test');
  assert(count1 === 1 && count2 === 1, 'Both callbacks should be called');

  dispatcher.off('test', callback1);
  dispatcher.trigger('test');
  assert(count1 === 1 && count2 === 2, 'Only callback2 should be called');
});

// Test 8: off(event, callback, context) - remove with context
test('off(event, callback, context) - remove with context', () => {
  const dispatcher = new EventDispatcher();
  const ctx1 = { name: 'ctx1' };
  const ctx2 = { name: 'ctx2' };
  let count1 = 0;
  let count2 = 0;

  const callback = function() {
    if (this === ctx1) count1++;
    if (this === ctx2) count2++;
  };

  dispatcher.on('test', callback, ctx1);
  dispatcher.on('test', callback, ctx2);

  dispatcher.trigger('test');
  assert(count1 === 1 && count2 === 1, 'Both contexts should be called');

  dispatcher.off('test', callback, ctx1);
  dispatcher.trigger('test');
  assert(count1 === 1 && count2 === 2, 'Only ctx2 should be called');
});

// Test 9: 'all' event
test("'all' event catches everything", () => {
  const dispatcher = new EventDispatcher();
  const events = [];

  dispatcher.on('all', (eventName) => {
    events.push(eventName);
  });

  dispatcher.trigger('event1');
  dispatcher.trigger('event2');
  dispatcher.trigger('event3');

  assert(events.length === 3, 'All events should be caught');
  assert(events[0] === 'event1', 'First event should be event1');
  assert(events[1] === 'event2', 'Second event should be event2');
  assert(events[2] === 'event3', 'Third event should be event3');
});

// Test 10: 'all' event with arguments
test("'all' event receives event name and arguments", () => {
  const dispatcher = new EventDispatcher();
  let receivedEvent = null;
  let receivedArgs = null;

  dispatcher.on('all', (eventName, ...args) => {
    receivedEvent = eventName;
    receivedArgs = args;
  });

  dispatcher.trigger('test', 'arg1', 'arg2');

  assert(receivedEvent === 'test', 'Event name should be passed');
  assert(receivedArgs[0] === 'arg1' && receivedArgs[1] === 'arg2', 'Arguments should be passed');
});

// Test 11: Multiple listeners on same event
test('Multiple listeners on same event', () => {
  const dispatcher = new EventDispatcher();
  let count = 0;

  dispatcher.on('test', () => count++);
  dispatcher.on('test', () => count++);
  dispatcher.on('test', () => count++);

  dispatcher.trigger('test');

  assert(count === 3, 'All listeners should be called');
});

// Test 12: Chaining
test('Method chaining', () => {
  const dispatcher = new EventDispatcher();
  let count = 0;

  const result = dispatcher
    .on('test', () => count++)
    .trigger('test')
    .off('test');

  assert(result === dispatcher, 'Methods should return this');
  assert(count === 1, 'Chaining should work');
});

// Test 13: Extends EventTarget
test('Extends EventTarget', () => {
  const dispatcher = new EventDispatcher();

  assert(dispatcher instanceof EventTarget, 'Should extend EventTarget');
  assert(dispatcher instanceof EventDispatcher, 'Should be instance of EventDispatcher');
});

// Test 14: Space-separated events in trigger
test('Space-separated events in trigger', () => {
  const dispatcher = new EventDispatcher();
  let count1 = 0;
  let count2 = 0;

  dispatcher.on('event1', () => count1++);
  dispatcher.on('event2', () => count2++);

  dispatcher.trigger('event1 event2');

  assert(count1 === 1 && count2 === 1, 'Both events should trigger');
});

// Test 15: No callback in on() - should return this
test('on() without callback returns this', () => {
  const dispatcher = new EventDispatcher();
  const result = dispatcher.on('test');

  assert(result === dispatcher, 'Should return this when no callback');
});

// Test 16: Event not triggering 'all' when event is 'all'
test("'all' event doesn't trigger itself", () => {
  const dispatcher = new EventDispatcher();
  let count = 0;

  dispatcher.on('all', () => count++);
  dispatcher.trigger('all');

  assert(count === 1, "'all' should not recursively trigger itself");
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}/${testsPassed + testsFailed}`);
console.log(`Tests failed: ${testsFailed}/${testsPassed + testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
  console.log('\n✅ All tests passed! EventDispatcher is working correctly.\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
