import Home from './components/Home'
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  
  return (
    <>
      <DndProvider backend={HTML5Backend}>
          <Home />
      </DndProvider>
    </>
  )
}

export default App
