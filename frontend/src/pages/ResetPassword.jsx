import React, { useState } from 'react';
import {
  MDBContainer,
  MDBTabsContent,
  MDBBtn,
  MDBInput,
  MDBCard,
  MDBCardBody
} from 'mdb-react-ui-kit';
import { resetPassword } from "../services/authService";

function App() {

  const [email, setEmail] = useState("");

  return (
    <MDBContainer className="p-3 my-5 d-flex justify-content-center">
      <MDBCard style={{ maxWidth: "500px", width: "100%", borderRadius: "1rem" }} className="shadow">
        <MDBCardBody className="p-4">

          <MDBTabsContent>
            {/* Reset Password Tab */}
              <div className="text-center mb-3">
                <p>Reset password</p>
              </div>

              <MDBInput wrapperClass='mb-4' label='Email address' id='form1' type='email' onChange={(e) => setEmail(e.target.value)} />

              <MDBBtn className="mb-4 w-100" onClick={() => resetPassword(email)}>Reset</MDBBtn>
          </MDBTabsContent>

        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
}

export default App;
