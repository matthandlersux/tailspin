import React from 'react';
import { Entry, SectionW } from '../utils';
import { JSON } from '../../components/JSON';

const timestamp = Date.now();

export const JSONSection = () => {
  return (
    <SectionW>
      <h2>JSON</h2>
      <div>
        <Entry title="Empty Object">
          <JSON json={{}} />
        </Entry>
        <Entry title="Shallow Object">
          <JSON json={{ a: 1, b: 2, c: 'ok', d: null }} />
        </Entry>
        <Entry title="Nested Object">
          <JSON
            json={{
              a: 1,
              b: 2,
              c: 'ok',
              d: null,
              e: {
                a: { ok: 1 },
                b: [{ thing1: 20023.32 }, { thing2: 'asdfasdfa' }],
              },
              f: true,
            }}
          />
        </Entry>
        <Entry title="JSON with multiline error">
          <JSON
            json={{
              msg: 'something',
              error: 'first line\nsecond line\nthird line',
            }}
          />
        </Entry>
        <Entry title="JSON with sorted keys">
          <JSON
            json={{
              level: 'info',
              time: timestamp,
              msg: 'something',
              thingAtEnd: true,
              error: 'first line\nsecond line\nthird line',
            }}
          />
        </Entry>
        <Entry title="JSON with invalid timestamp">
          <JSON
            json={{
              level: 'info',
              timestamp: false,
              msg: 'something',
              error: 'first line\nsecond line\nthird line',
            }}
          />
        </Entry>
        <Entry title="JSON with levels">
          <JSON json={{ level: 'trace', msg: 'something' }} />
          <JSON json={{ level: 'debug', msg: 'something' }} />
          <JSON json={{ level: 'info', msg: 'something' }} />
          <JSON json={{ level: 'warn', msg: 'something' }} />
          <JSON json={{ level: 'error', msg: 'something' }} />
          <JSON json={{ level: 'fatal', msg: 'something' }} />
        </Entry>
      </div>
    </SectionW>
  );
};
