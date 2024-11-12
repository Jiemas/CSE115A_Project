import React, {useContext} from 'react';
import {it, beforeAll, afterAll, afterEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import { MemoryRouter, Routes, Route, sessionStorage } from 'react-router-dom';
import { CreateSetPage } from '../components/CreateSetPage';
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

const setSet = async () => {
  set.name = 'asdf';
};

/**
 * @return {object}
 */
function renderCreateSetPage() {
  return <MemoryRouter> 
  <SetContext.Provider value={{set, setSet}}>
    <Routes>
      <Route path="/" element={<CreateSetPage />} /> 
    </Routes>
  </SetContext.Provider> 
</MemoryRouter>;
};
window.sessionStorage.setItem('accessToken', JSON.stringify('random'));

it('renders Create Set page', async () => {
  render(renderCreateSetPage());
  await waitFor(() => {
    expect(screen.getByText('Create New Flashcard Set')).toBeInTheDocument();
  });
}); 

it('success create set', async () => { 
    server.use(
        http.put(`${URL_set}`, async () => {
            return HttpResponse.json('12345', { status: 201 });
        }),
    );
    server.use(
      http.get(`${path}/card/12345`, async () => {
          return HttpResponse.json([
            {
              "front": "string",
              "back": "string",
              "starred": true,
              "key": "string"
            }
          ], { status: 200 });
      }),
    );
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
    render(renderCreateSetPage());
    
    await waitFor(() => {
      expect(screen.getByText('Create New Flashcard Set')).toBeInTheDocument();
    });
    inputToField("Set Name", "cells unit 3");
    inputToField("Description", "i'm learning about cells");
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', {name: 'Create Set'}));
    });
    await waitFor(() => { expect(screen.getByText('Edit Flashcard Set')).toBeInTheDocument(); 
    }, {timeout: 1400}); 
  }); 
