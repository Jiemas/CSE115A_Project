import React, { useState } from 'react';
import {it, beforeAll, afterAll, afterEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import { BrowserRouter } from 'react-router-dom';
import { expect } from 'vitest';
import App, { SetContext } from '../components/App';


const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close()); 

it('Basic render', async () => {
  render(<App/>);
});

it('renders the LoginPage by default', () => {
  render(<App />);
  expect(screen.getByText('Log In')).toBeInTheDocument(); 
});

it('navigates to Home when Login is successful', async () => {
  render(<App />); 
  fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'johndoe' } }); 
  fireEvent.click(screen.getByRole('button', { name: /Login/i })); 
  await waitFor(
    () => expect(screen.getByText('Rapid Review')).toBeInTheDocument(),
    { timeout: 1500 } 
  );
});

it('navigates to CreateSetPage when /create-set route is accessed', async () => {
  render(<App />);
  window.history.pushState({}, 'Create Set page', '/create-set');
  await waitFor(
    () => expect(screen.getByText('Rapid Review')).toBeInTheDocument(),
    { timeout: 1500 } 
  );
});

const TestComponent1 = () => {
  const setContext = React.useContext(SetContext);
  return <div>{JSON.stringify(setContext)}</div>;
};

it('provides SetContext to child components', () => {
  render(
    <SetContext.Provider value={{ set: { card_num: 0, description: 'test_description_frontend', name: 'test_name_frontend', owner: 'global', key: '' } }}>
      <TestComponent1 />
    </SetContext.Provider>
  );

  expect(screen.getByText(/{"set":{/)).toBeInTheDocument();  
});