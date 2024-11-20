import React, {useContext} from 'react';
import {it, beforeAll, afterAll, afterEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import { MemoryRouter, Routes, Route, sessionStorage } from 'react-router-dom';
import { CreateSetPage } from '../components/CreateSetPage';
import { expect } from 'vitest';
import { SetContext } from '../components/App';  
import { Home } from '../components/home-page/HomePage';

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
  return <MemoryRouter initialEntries={['/create-set']}> 
  <SetContext.Provider value={{set, setSet}}>
    <Routes>
      <Route path="/create-set" element={<CreateSetPage />} /> 
      <Route path="/" element={<div>Worked</div>} /> 
    </Routes>
  </SetContext.Provider> 
</MemoryRouter>;
};

const serverMockGetCards = () => {
  server.use(
    http.get(`${path}/card/*`, async () => {
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
};

const serverMockGetSet = () => {
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
};

const serverMockPutSet = () => {
  server.use(
    http.put(`${URL_set}`, async () => {
        return HttpResponse.json('12345', { status: 201 });
    }),
  );
};

const serverMockPutCards = () => {
  server.use(
    http.put(`${path}/card/12345`, async () => {
        return HttpResponse.json([
          {
            "front": "string",
            "back": "string",
            "starred": true,
            "key": "string"
          }
        ], { status: 201 });
    }),
  );
};

window.sessionStorage.setItem('accessToken', JSON.stringify('random'));

it('renders Create Set page', async () => {
  render(renderCreateSetPage());
  await waitFor(() => {
    expect(screen.getByText('Create New Flashcard Set')).toBeInTheDocument();
  });
}); 

it('success create set', async () => { 
    serverMockPutSet();
    serverMockGetCards();
    serverMockGetSet();
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
  
it('success add another term', async () => { 
  set.name = ''
  serverMockPutSet();
  serverMockGetCards();
  serverMockGetSet();
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
  await waitFor(() => {
    fireEvent.click(screen.getByRole('button', {name: 'Add Another Term'}));
  });   
  await waitFor(() => { expect(screen.getByLabelText('Term 1')).toBeInTheDocument(); 
  }, {timeout: 1400}); 
  await waitFor(() => {
    fireEvent.click(screen.getByRole('button', {name: 'Add Another Term'}));
  });   
  await waitFor(() => { expect(screen.getByLabelText('Term 2')).toBeInTheDocument(); 
  }, {timeout: 1400}); 
}); 

it('successfully updates the set name, description, and terms', async () => {
  serverMockPutCards();
  server.use(
    http.put(`${URL_set}`, async () => {
        return HttpResponse.json([
          {
            "card_num": 0,
            "description": "string",
            "name": "string",
            "owner": "string",
            "key": "12345"
          }
        ], { status: 201 });
    }),
  );
  serverMockGetCards();
  render(renderCreateSetPage()); 
  await waitFor(() => {
    expect(screen.getByText('Edit Flashcard Set')).toBeInTheDocument();
  });
  
  fireEvent.change(screen.getByLabelText('Set Name'), { target: { value: 'Updated Set Name' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated Set Description' } });

  fireEvent.click(screen.getByRole('button', { name: 'Add Another Term' }));

  fireEvent.change(screen.getByLabelText(/Term 1/i), { target: { value: 'Updated Term Front' } });
  fireEvent.change(screen.getByLabelText(/Definition 1/i), { target: { value: 'Updated Term Back' } });

  fireEvent.click(screen.getByRole('button', { name: 'Update Set' }));

  await waitFor(() => {
    expect(screen.queryByText('No duplicate cards allowed')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated Set Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated Set Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated Term Front')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated Term Back')).toBeInTheDocument();
  });

  //set.name = ''
  render(renderCreateSetPage()); 
  await waitFor(() => {
    expect(screen.queryByText('No duplicate cards allowed')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated Set Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated Set Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated Term Front')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated Term Back')).toBeInTheDocument();
  });
});

// it('successfully deletes set', async () => {  
//   set.name = 'Set Name'
//   server.use(
//     http.delete(`${URL_set}/12345`, async () => {
//         return HttpResponse.json({ status: 200 });
//     }),
//   ); 
//   render(renderCreateSetPage()); 
//   await waitFor(() => {
//     expect(screen.getByText('Edit Flashcard Set')).toBeInTheDocument();
//     expect(screen.getByButton('Delete Set')).toBeInTheDocument();
//   }); 

//   await waitFor (() => {fireEvent.click(screen.getByRole('button', { name: 'Delete Set' }))});

//   await waitFor(() => {
//     expect(screen.getByText('My Flashcards')).toBeInTheDocument(); 
//   }, {timeout: 2000});

// });

it('successfully deletes set', async () => {
  set.name = 'Update Set Name';
  set.key = '12345';
  serverMockGetCards();
  serverMockPutCards();
  server.use(
    http.delete(`${URL_set}/*`, async () => {
        return HttpResponse.json({ status: 200 });
    }),
  );
  //set.name = 'Set Name'
  render(renderCreateSetPage()); 
  await waitFor(() => {
    expect(screen.getByText('Edit Flashcard Set')).toBeInTheDocument();
  }); 

  await waitFor(() => { 
    fireEvent.click(screen.getByRole('button', { name: 'Delete Set' }));
  });

  // await waitFor(() => { 
  //   expect(screen.getByButton('Comfirm Delete?')).toBeInTheDocument();
  // }, {timeout: 1000});

  await waitFor(() => { 
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete?' }));
  });

  // server.use(
  //   http.delete(`${URL_set}`, async () => {
  //       return HttpResponse.json({ status: 200 });
  //   }),
  // );
  // render(renderCreateSetPage()); 
  await waitFor(() => {
    expect(screen.getByText('Worked')).toBeInTheDocument(); 
  }, {timeout: 2000});
});