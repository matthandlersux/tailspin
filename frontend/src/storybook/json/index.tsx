import React from 'react';
import { Entry, SectionW } from '../utils';
import { JSON } from '../../components/JSON';

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
      </div>
    </SectionW>
  );
};
