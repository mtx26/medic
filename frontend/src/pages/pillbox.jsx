// pages/PillboxPage.jsx
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ForcedLandscapeWrapper from '../components/ForcedLandscapeWrapper';
import PillboxDisplay from '../components/PillboxDisplay';

function PillboxPage({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const location = useLocation();
  const params = useParams();
  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const selectedDate = new URLSearchParams(location.search).get('date');
  console.log(selectedDate);

  return (
    <ForcedLandscapeWrapper>
      <PillboxDisplay
        type="pillbox"
        selectedDate={selectedDate}
        calendarType={calendarType}
        calendarId={calendarId}
        basePath={basePath}
        personalCalendars={personalCalendars}
        sharedUserCalendars={sharedUserCalendars}
        tokenCalendars={tokenCalendars}
      />
    </ForcedLandscapeWrapper>
  );
}

export default PillboxPage;
