import AppRouter from "./routes/AppRouter";
import { BrowserRouter} from "react-router-dom";
import "./App.css";



function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;