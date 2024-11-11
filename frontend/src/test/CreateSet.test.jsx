import React from 'react';
import {it, beforeAll, afterAll, afterEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import { MemoryRouter, Routes, Route, sessionStorage } from 'react-router-dom';
import { CreateSetPage } from '../components/CreateSetPage';
import { expect } from 'vitest';
import { SetContext } from '../components/App';  

import {path} from '../helper';  
const URL_login = `${path}/login`; 
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
function renderCreateSetPage() {
  return <MemoryRouter> 
  <SetContext.Provider value={{set, setSet}}>
    <Routes>
      <Route path="/" element={<CreateSetPage />} /> 
    </Routes>
  </SetContext.Provider> 
</MemoryRouter>;
};

it('renders Create Set page', async () => {
  window.sessionStorage.setItem('accessToken', JSON.stringify('random'));
  server.use(
    http.post(URL_login, async () => {
      return HttpResponse.json(
          [], {status: 200});
    }),
  );
  render(renderCreateSetPage());
  await waitFor(() => {
    expect(screen.getByText('Create New Flashcard Set')).toBeInTheDocument();
  });
}); 

it('success create set', async () => { 
    server.use(
        http.put(URL_set, async () => {
            return HttpResponse.json({ key: 'fake-set-key' }, { status: 201 });
        }),
    );
    server.use(
        http.put(`${URL_set}/{fake-set-key}`, async () => {
            return HttpResponse.json({ key: 'fake-set-key' }, { status: 201 });
        }),
    );
    render(renderCreateSetPage());
    
    await waitFor(() => {
      expect(screen.getByText('Create New Flashcard Set')).toBeInTheDocument();
    });
    inputToField("Set Name", "cells unit 3");
    inputToField("Description", "i'm learning about cells");
    
    fireEvent.click(screen.getByRole('button', {name: 'Create Set'}));
    await waitFor(() => { expect(screen.getByText('Edit Flashcard Set')).toBeInTheDocument(); }); 
  }); 
