import React from "react";
import {BrowserRouter,Routes,Route} from "react-router-dom";
import Homepage from "./HomePage";

function Home (){
    return(
        <BrowserRouter>
        <Routes>
          <Route path='/' element={<Homepage/>}/>
        </Routes>
        
      </BrowserRouter>
       
    );
};

export default Home;