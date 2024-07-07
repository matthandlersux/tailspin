import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  font-family: mono;
  font-weight: bold;
`;

const String = styled.span`
  margin-left: 10px;
  color: lime;
`;

const Number = styled.span`
  margin-left: 10px;
  color: red;
`;

const Bool = styled.span`
  color: blue;
`;

const Null = styled.span`
  margin-left: 10px;
  color: salmon;
`;

const Brackets = styled.div<{ inline?: boolean }>`
  display: ${props => (props.inline ? 'inline-block' : 'block')};
  font-size: 80%;
  color: yellow;
`;

const ObjectBody = styled.div``;

const ObjectEntry = styled.div`
  margin-left: 20px;
`;

const ObjectKey = styled.span`
  display: inline-block;
  color: aqua;
  min-width: 30px;
`;

const ObjectValue = styled.span``;

const ArrayBody = styled.div``;

const ArrayEntry = styled.div`
  margin-left: 10px;
`;

export const JSON = (props: { json: unknown }) => {
  return (
    <Wrapper>
      <JSONValue json={props.json} />
    </Wrapper>
  );
};

type Props = {
  json: unknown;
  isChild?: boolean;
  hasComma?: boolean;
};

const JSONValue = ({ json, hasComma }: Props) => {
  if (typeof json == 'string') {
    return <String>"{json}"</String>;
  } else if (typeof json == 'number') {
    return <Number>{json}</Number>;
  } else if (typeof json == 'boolean') {
    return <Bool>{json}</Bool>;
  } else if (Array.isArray(json)) {
    return <JSONArray json={json} />;
  } else if (json === null || json === undefined) {
    return <Null>null</Null>;
  } else {
    return <JSONObject json={json} hasComma={hasComma} />;
  }
};

const JSONObject = (props: Props & { json: {} }) => {
  return (
    <ObjectBody>
      <Brackets inline={props.isChild}>{'{'}</Brackets>
      {Object.entries(props.json).map(([k, v]) => {
        return (
          <ObjectEntry>
            <ObjectKey>{k}:</ObjectKey>
            <ObjectValue>
              <JSONValue json={v} isChild={true} />
            </ObjectValue>
          </ObjectEntry>
        );
      })}
      <Brackets>
        {'}'}
        {props.hasComma && <Brackets inline>,</Brackets>}
      </Brackets>
    </ObjectBody>
  );
};

const JSONArray = (props: { json: unknown[] }) => {
  return (
    <ArrayBody>
      <Brackets>{'['}</Brackets>
      {props.json.map((d, i) => (
        <ArrayEntry>
          <JSONValue json={d} isChild={true} hasComma />
        </ArrayEntry>
      ))}
      <Brackets>{']'}</Brackets>
    </ArrayBody>
  );
};
