import React from 'react';
import {it, beforeAll, afterAll, afterEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import { MemoryRouter, Routes, Route, sessionStorage } from 'react-router-dom';
import { Home } from '../components/home-page/HomePage'; 
import { expect } from 'vitest';
import { SetContext } from '../components/App';   

import {path} from '../helper';  
const URL_set = `${path}/set`; 

async function inputToField(label, value) {
  // https://allmaddesigns.com/test-text-input-in-jest-with-fireevent/
  await fireEvent.change(screen.getByLabelText(label), {
    target: {value}});
}

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());  

let set = {
    card_num: 0,
    description: '',
    name: '',
    owner: '',
    key: ''
};
const setSet = (elem) => {
  set = elem;
};

/**
 * @return {object}
 */
function renderHome() {
  return <MemoryRouter> 
  <SetContext.Provider value={{set, setSet}}>
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  </SetContext.Provider> 
</MemoryRouter>;
};

it('renders homepage', async () => {
  window.sessionStorage.setItem('accessToken', JSON.stringify('random'));
  server.use(
    http.get(`${URL_set}`, async () => {
        return HttpResponse.json([
          {
            "card_num": 0,
            "description": "string",
            "name": "string",
            "owner": "string",
            "key": "12345"
          }
        ], { status: 200 });
    }),
  );
  render(renderHome());
  await waitFor(() => {
    expect(screen.getByText('My Flashcards')).toBeInTheDocument();
  });
}); 

it('create set button works', async () => {    
  server.use(
    http.get(`${URL_set}`, async () => {
        return HttpResponse.json([
          {
            "card_num": 0,
            "description": "string",
            "name": "string",
            "owner": "string",
            "key": "12345"
          }
        ], { status: 200 });
    }),
  );
  render(
    <MemoryRouter> 
      <SetContext.Provider value={{set, setSet}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-set" element={<div>Worked</div>} />
        </Routes>
      </SetContext.Provider> 
</MemoryRouter>); 

  await waitFor(() => {
    expect(screen.getByText('My Flashcards')).toBeInTheDocument();
  });

  await waitFor(() => {
    fireEvent.click(screen.getByText('Create New Set'));
  }); 

  await waitFor(() => {
    expect(screen.getByText('Worked')).toBeInTheDocument();
  });
});
