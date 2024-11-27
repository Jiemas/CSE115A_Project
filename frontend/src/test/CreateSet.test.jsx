import { it, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CreateSetPage } from '../components/CreateSetPage';
import { expect } from 'vitest';
import { SetContext } from '../components/App';

import { path } from '../helper';
const URL_set = `${path}/set`;

async function inputToField(label, value) {
  // https://allmaddesigns.com/test-text-input-in-jest-with-fireevent/
  await fireEvent.change(await screen.findByLabelText(label), {
    target: { value },
  });
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
  key: '',
};

const setSet = async () => {
  set.name = 'asdf';
};

/**
 * @return {object}
 */
function renderCreateSetPage() {
  return (
    <MemoryRouter initialEntries={['/create-set']}>
      <SetContext.Provider value={{ set, setSet }}>
        <Routes>
          <Route path='/create-set' element={<CreateSetPage />} />
          <Route path='/' element={<div>Worked</div>} />
        </Routes>
      </SetContext.Provider>
    </MemoryRouter>
  );
}

const serverMockGetCards = () => {
  server.use(
    http.get(`${path}/card/*`, async () => {
      return HttpResponse.json(
        [
          {
            front: 'string front',
            back: 'string back',
            starred: true,
            key: 'string',
          },
        ],
        { status: 200 }
      );
    })
  );
};

const serverMockGetSet = () => {
  server.use(
    http.get(`${URL_set}`, async () => {
      return HttpResponse.json(
        [
          {
            card_num: 0,
            description: 'string',
            name: 'string',
            owner: 'string',
            key: '12345',
          },
        ],
        { status: 200 }
      );
    })
  );
};

const serverMockPutSet = () => {
  server.use(
    http.put(`${URL_set}*`, async () => {
      return HttpResponse.json('12345', { status: 201 });
    })
  );
};

const serverMockPutCards = () => {
  server.use(
    http.put(`${path}/card/12345`, async () => {
      return HttpResponse.json(
        [
          {
            front: 'string',
            back: 'string',
            starred: true,
            key: 'string',
          },
        ],
        { status: 201 }
      );
    })
  );
};

const serverMockPostCards = () => {
  server.use(
    http.post(`${path}/card/*`, async () => {
      return HttpResponse.json(
        {
          front: 'string',
          back: 'string',
          starred: true,
          key: 'string',
        },
        { status: 201 }
      );
    })
  );
};

window.sessionStorage.setItem('accessToken', JSON.stringify('random'));

it('renders Create Set page', async () => {
  render(renderCreateSetPage());
  await waitFor(() => {
    expect(screen.getByText('Create New Flashcard Set')).toBeInTheDocument();
  });
});

const clickButton = async buttonName => {
  await waitFor(() => {
    fireEvent.click(screen.getByRole('button', { name: buttonName }));
  });
};

const waitExpect = async screenText => {
  await waitFor(() => {
    expect(screen.getAllByText(screenText)[0]).toBeInTheDocument();
  });
};

const longWaitExpect = async screenText => {
  await waitFor(
    () => {
      expect(screen.getAllByText(screenText)[0]).toBeInTheDocument();
    },
    { timeout: 1400 }
  );
};

it('success create set', async () => {
  serverMockPutSet();
  serverMockGetCards();
  serverMockGetSet();
  render(renderCreateSetPage());
  await waitExpect('Create New Flashcard Set');
  await inputToField('Set Name', 'cells unit 3');
  await inputToField('Description', "i'm learning about cells");
  await clickButton('Create Set');
  await longWaitExpect('Edit Flashcard Set');
});

it('success add another term', async () => {
  set = { name: 'asdf', key: '12345' };
  serverMockPutSet();
  serverMockGetCards();
  serverMockGetSet();
  render(renderCreateSetPage());
  await waitExpect('Edit Flashcard Set');
  await clickButton('Add Another Term');
  await longWaitExpect('Term 1');
  await clickButton('Add Another Term');
  await longWaitExpect('Term 2');
});

it('successfully updates the set name, description, and terms', async () => {
  set = { name: 'asdf', key: '12345' };
  sessionStorage.removeItem('set');
  serverMockPutCards();
  serverMockPutSet();
  serverMockGetCards();
  serverMockPostCards();
  render(renderCreateSetPage());
  await waitExpect('Edit Flashcard Set');
  await inputToField('Set Name', 'Updated Set Name');
  await waitExpect('Updated Set Name');
  await inputToField('Description', 'Updated Set Description');
  await waitExpect('Updated Set Description');
  await inputToField('Term 1', 'Updated front');
  await waitExpect('Updated front');
  await inputToField('Definition 1', 'Updated back');
  await waitExpect('Updated back');
  await clickButton('Update Set');
  expect(
    screen.queryByText('No duplicate cards allowed')
  ).not.toBeInTheDocument();
});

it('successfully deletes set', async () => {
  set.name = 'Update Set Name';
  set.key = '12345';
  serverMockGetCards();
  serverMockPutCards();
  serverMockPostCards();
  server.use(
    http.delete(`${URL_set}/*`, async () => {
      return HttpResponse.json({ status: 200 });
    })
  );
  render(renderCreateSetPage());
  waitExpect('Edit Flashcard Set');
  clickButton('Delete Set');
  clickButton('Confirm Delete?');
  longWaitExpect('Worked');
});
