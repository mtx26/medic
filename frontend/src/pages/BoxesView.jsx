import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '../hooks/useRealtimeBoxesSwitcher';
import AlertSystem from '../components/AlertSystem';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';
import { v4 as uuidv4 } from 'uuid';
import { fetchSuggestions } from '../utils/fetchSuggestions';
import ActionSheet from '../components/ActionSheet';
import openNotice from '../utils/openNotice';
import { useTranslation } from 'react-i18next';

function BoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const location = useLocation();
  const params = useParams();
  const { t } = useTranslation();

  const [boxes, setBoxes] = useState([]);
  const [loadingBoxes, setLoadingBoxes] = useState(undefined);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [selectedModifyBox, setSelectedModifyBox] = useState(null);
  const [selectedDropBox, setSelectedDropBox] = useState({});
  const [modifyBoxName, setModifyBoxName] = useState({});
  const [modifyBoxCapacity, setModifyBoxCapacity] = useState({});
  const [modifyBoxStockAlertThreshold, setModifyBoxStockAlertThreshold] =
    useState({});
  const [modifyBoxStockQuantity, setModifyBoxStockQuantity] = useState({});
  const [boxConditions, setBoxConditions] = useState({});
  const [dose, setDose] = useState({});

  let calendarType = 'personal';
  let calendarId = params.calendarId;

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
  }

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType];

  useRealtimeBoxesSwitcher(calendarType, calendarId, setBoxes, setLoadingBoxes);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const box = {
      name: modifyBoxName[selectedModifyBox],
      dose: dose[selectedModifyBox],
      box_capacity: modifyBoxCapacity[selectedModifyBox],
      stock_alert_threshold: modifyBoxStockAlertThreshold[selectedModifyBox],
      stock_quantity: modifyBoxStockQuantity[selectedModifyBox],
      conditions: Object.values(boxConditions[selectedModifyBox]).filter(
        (condition) => condition !== undefined
      ),
    };
    const res = await calendarSource.updateBox(
      calendarId,
      selectedModifyBox,
      box
    );
    if (res.success) {
      setAlertMessage('✅ ' + res.message);
      setAlertType('success');
    } else {
      setAlertMessage('❌ ' + res.error);
      setAlertType('danger');
    }
    setSelectedModifyBox(null);
  };

  const restockBox = async (boxId) => {
    const box = {
      name: boxes.find((box) => box.id === boxId).name,
      dose: boxes.find((box) => box.id === boxId).dose,
      box_capacity: boxes.find((box) => box.id === boxId).box_capacity,
      stock_alert_threshold: boxes.find((box) => box.id === boxId)
        .stock_alert_threshold,
      stock_quantity: boxes.find((box) => box.id === boxId).box_capacity,
      conditions: boxes.find((box) => box.id === boxId).conditions,
    };
    const res = await calendarSource.updateBox(calendarId, boxId, box);
    if (res.success) {
      setAlertMessage('✅ ' + res.message);
      setAlertType('success');
    } else {
      setAlertMessage('❌ ' + res.error);
      setAlertType('danger');
    }
  };

  const addBox = async () => {
    const res = await calendarSource.createBox(calendarId, t('boxes.new_box'));
    if (res.success) {
      setSelectedModifyBox(res.boxId);
      setSelectedDropBox((prev) => ({ ...prev, [res.boxId]: true }));
    }
  };

  const deleteBox = async (boxId) => {
    const res = await calendarSource.deleteBox(calendarId, boxId);
    if (res.success) {
      setAlertMessage('✅ ' + res.message);
      setAlertType('success');
    } else {
      setAlertMessage('❌ ' + res.error);
      setAlertType('danger');
    }
  };

  useEffect(() => {
    if (boxes.length > 0) {
      setModifyBoxName(
        boxes.reduce((acc, box) => ({ ...acc, [box.id]: box.name }), {})
      );
      setDose(boxes.reduce((acc, box) => ({ ...acc, [box.id]: box.dose }), {}));
      setModifyBoxCapacity(
        boxes.reduce((acc, box) => ({ ...acc, [box.id]: box.box_capacity }), {})
      );
      setModifyBoxStockAlertThreshold(
        boxes.reduce(
          (acc, box) => ({ ...acc, [box.id]: box.stock_alert_threshold }),
          {}
        )
      );
      setModifyBoxStockQuantity(
        boxes.reduce(
          (acc, box) => ({ ...acc, [box.id]: box.stock_quantity }),
          {}
        )
      );
      setBoxConditions(
        boxes.reduce(
          (acc, box) => ({
            ...acc,
            [box.id]: box.conditions.reduce(
              (acc, condition) => ({ ...acc, [condition.id]: condition }),
              {}
            ),
          }),
          {}
        )
      );
    }
  }, [boxes]);

  if (loadingBoxes === undefined) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('loading_medicines')}</span>
        </div>
      </div>
    );
  }

  if (loadingBoxes === false) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        {t('invalid_or_expired_link')}
      </div>
    );
  }

  return (
    <div className="container align-items-center d-flex flex-column gap-3">
      <div className="p-1 w-100" style={{ maxWidth: '800px' }}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <h4 className="mb-0 fw-bold">
            <i className="bi bi-box-seam me-2"></i> {t('boxes.title')}
          </h4>
          <div className="ms-auto">
            <ActionSheet
              actions={[
                {
                  label: (
                    <>
                      <i className="bi bi-download me-2" /> {t('boxes.export_pdf')}
                    </>
                  ),
                  onClick: () => calendarSource.downloadCalendarPdf(calendarId),
                },
              ]}
            />
          </div>
        </div>



        <AlertSystem
          type={alertType}
          message={alertMessage}
          onClose={() => {
            setAlertMessage('');
            setAlertType('');
          }}
        />
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {boxes.map((box) => (
            <div className="col-12 col-md-6 mb-3" key={box.id}>
              {selectedModifyBox && selectedModifyBox === box.id ? (
                <form onSubmit={handleSubmit}>
                  <BoxCard
                    box={box}
                    selectedModifyBox={selectedModifyBox}
                    setSelectedModifyBox={setSelectedModifyBox}
                    setModifyBoxName={setModifyBoxName}
                    modifyBoxName={modifyBoxName}
                    setModifyBoxCapacity={setModifyBoxCapacity}
                    modifyBoxCapacity={modifyBoxCapacity}
                    setModifyBoxStockAlertThreshold={
                      setModifyBoxStockAlertThreshold
                    }
                    modifyBoxStockAlertThreshold={modifyBoxStockAlertThreshold}
                    setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                    modifyBoxStockQuantity={modifyBoxStockQuantity}
                    restockBox={restockBox}
                    deleteBox={deleteBox}
                    selectedDropBox={selectedDropBox}
                    setSelectedDropBox={setSelectedDropBox}
                    boxConditions={boxConditions}
                    setBoxConditions={setBoxConditions}
                    setDose={setDose}
                    dose={dose}
                  />
                </form>
              ) : (
                <BoxCard
                  box={box}
                  selectedModifyBox={selectedModifyBox}
                  setSelectedModifyBox={setSelectedModifyBox}
                  setModifyBoxName={setModifyBoxName}
                  modifyBoxName={modifyBoxName}
                  setModifyBoxCapacity={setModifyBoxCapacity}
                  modifyBoxCapacity={modifyBoxCapacity}
                  setModifyBoxStockAlertThreshold={
                    setModifyBoxStockAlertThreshold
                  }
                  modifyBoxStockAlertThreshold={modifyBoxStockAlertThreshold}
                  setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                  modifyBoxStockQuantity={modifyBoxStockQuantity}
                  restockBox={restockBox}
                  deleteBox={deleteBox}
                  selectedDropBox={selectedDropBox}
                  setSelectedDropBox={setSelectedDropBox}
                  boxConditions={boxConditions}
                  setBoxConditions={setBoxConditions}
                  setDose={setDose}
                  dose={dose}
                />
              )}
            </div>
          ))}
          <div className="col-12 col-md-6 mb-3">
            <button
              type="button"
              onClick={() => addBox()}
              className="btn p-0 border-0 bg-transparent text-start h-100 w-100"
              style={{ cursor: 'pointer' }}
              aria-label={t('boxes.add_box')}
              title={t('boxes.add_box')}
            >
              <div className="card h-100 shadow-sm border border-success">
                <div className="card-body d-flex flex-column justify-content-center align-items-center">
                  <i className="bi bi-plus-circle text-success fs-1"></i>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoxCard({
  box,
  selectedModifyBox,
  setSelectedModifyBox,
  setModifyBoxName,
  modifyBoxName,
  setModifyBoxCapacity,
  modifyBoxCapacity,
  setModifyBoxStockAlertThreshold,
  modifyBoxStockAlertThreshold,
  setModifyBoxStockQuantity,
  modifyBoxStockQuantity,
  restockBox,
  deleteBox,
  selectedDropBox,
  setSelectedDropBox,
  boxConditions,
  setBoxConditions,
  setDose,
  dose,
}) {
  const { t } = useTranslation();
  const editable = selectedModifyBox === box.id;
  const timeOfDayMap = {
    morning: t('morning'),
    noon: t('noon'),
    evening: t('evening'),
  };

  return (
    <div
      className={`card h-100 shadow-sm border ${
        box.box_capacity === 0
          ? ''
          : box.stock_quantity <= 0
            ? 'border-danger'
            : box.stock_quantity <= box.stock_alert_threshold
              ? 'border-warning'
              : ''
      }`}
    >
      <div className="card-body position-relative">
        <div className="position-absolute top-0 end-0 m-2">
          {(!selectedModifyBox || selectedModifyBox !== box.id) && (
            <ActionSheet
              buttonSize="sm"
              actions={[
                {
                  label: (
                    <>
                      <i className="bi bi-pencil me-2" /> {t('boxes.edit')}
                    </>
                  ),
                  onClick: () => setSelectedModifyBox(box.id),
                },
                {
                  label: (
                    <>
                      <i className="bi bi-file-earmark-pdf me-2" /> {t('boxes.view_notice')}
                    </>
                  ),
                  onClick: () => openNotice(box.id),
                },
                {
                  separator: true,
                },
                {
                  label: (
                    <>
                      <i className="bi bi-trash me-2" /> {t('boxes.delete')}
                    </>
                  ),
                  onClick: () => deleteBox(box.id),
                  danger: true,
                },
              ]}
            />
          )}
        </div>

        <h5 className="card-title fs-semibold mb-1">
          {selectedModifyBox && selectedModifyBox === box.id ? (
            <InputDropdown
              name={modifyBoxName[box.id]}
              dose={dose[box.id]}
              onChangeName={(newName) =>
                setModifyBoxName({ ...modifyBoxName, [box.id]: newName })
              }
              onChangeDose={(newDose) =>
                setDose({ ...dose, [box.id]: newDose })
              }
              onChangeBoxCapacity={(newBoxCapacity) =>
                setModifyBoxCapacity({
                  ...modifyBoxCapacity,
                  [box.id]: newBoxCapacity,
                })
              }
              onChangeStockQuantity={(newStockQuantity) =>
                setModifyBoxStockQuantity({
                  ...modifyBoxStockQuantity,
                  [box.id]: newStockQuantity,
                })
              }
              fetchSuggestions={fetchSuggestions}
            />
          ) : (
            modifyBoxName[box.id] +
            (dose[box.id] > 0 ? ' (' + dose[box.id] + ' mg)' : '')
          )}
        </h5>

        <div className="d-flex mb-2 gap-2">
          <BoxField
            type="number"
            label={t('boxes.capacity')}
            value={modifyBoxCapacity[box.id]}
            editable={editable}
            onChange={(e) =>
              setModifyBoxCapacity({
                ...modifyBoxCapacity,
                [box.id]: e.target.value,
              })
            }
          />
          <BoxField
            type="number"
            label={t('boxes.alert_threshold')}
            value={modifyBoxStockAlertThreshold[box.id]}
            editable={editable}
            onChange={(e) =>
              setModifyBoxStockAlertThreshold({
                ...modifyBoxStockAlertThreshold,
                [box.id]: e.target.value,
              })
            }
          />
        </div>
        <div className="d-flex mb-2 gap-2 align-items-center">
          <BoxField
            type="number"
            label={t('boxes.remaining_qty')}
            value={modifyBoxStockQuantity[box.id]}
            editable={editable}
            onChange={(e) =>
              setModifyBoxStockQuantity({
                ...modifyBoxStockQuantity,
                [box.id]: e.target.value,
              })
            }
          />
          {(!selectedModifyBox || selectedModifyBox !== box.id) && (
            <>
              <div className="w-50">
                <button
                  className="btn btn-outline-success"
                  onClick={() => restockBox(box.id)}
                  aria-label={t('boxes.restock')}
                  title={t('boxes.restock')}
                >
                  <i className="bi bi-plus-circle"></i> {t('boxes.restock')}
                </button>
              </div>
            </>
          )}
        </div>

        {(!selectedModifyBox || selectedModifyBox !== box.id) && (
          <div className="d-flex mb-2 align-items-center w-100">
            <StockBadge box={box} />
          </div>  
        )}

        <div className="mt-4 mb-2">
          <hr className="border-dark mb-0" />
          <h5 className="w-100">
            <button
              className="btn w-100 text-start d-flex justify-content-between align-items-center border-0 bg-transparent px-0 pb-0 mb-0"
              type="button"
              title={t('boxes.intake_conditions')}
              aria-label={t('boxes.intake_conditions')}
              onClick={() => {
                if (selectedDropBox[box.id] === true) {
                  setSelectedDropBox((prev) => ({ ...prev, [box.id]: false }));
                } else {
                  setSelectedDropBox((prev) => ({ ...prev, [box.id]: true }));
                }
              }}
            >
              <span>{t('boxes.intake_conditions')}</span>
              <i
                className={`bi bi-chevron-${selectedDropBox[box.id] === true ? 'up' : 'down'}`}
              ></i>
            </button>
          </h5>

          {/* Condition de prise */}
          {selectedDropBox[box.id] === true && (
            <div className="mt-2">
              {editable ? (
                <>
                  {Object.values(boxConditions[box.id] || {})
                    .filter((condition) => condition !== undefined)
                    .map((condition) => (
                      <div key={condition.id}>
                        <div className="mb-2 p-3 border rounded bg-light">
                          <label htmlFor="tablet_count">
                            {t('boxes.condition.tablet_count')}
                          </label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            defaultValue={condition.tablet_count}
                            title={t('boxes.condition.tablet_count')}
                            aria-label={t('boxes.condition.tablet_count')}
                            min={0}
                            step={0.25}
                            onChange={(e) =>
                              setBoxConditions((prev) => ({
                                ...prev,
                                [box.id]: {
                                  ...prev[box.id],
                                  [condition.id]: {
                                    ...prev[box.id][condition.id],
                                    tablet_count: e.target.value,
                                  },
                                },
                              }))
                            }
                          />
                          <label htmlFor="time_of_day">{t('boxes.condition.time_of_day')}</label>
                          <select
                            className="form-control form-control-sm"
                            defaultValue={condition.time_of_day}
                            title={t('boxes.condition.time_of_day')}
                            aria-label={t('boxes.condition.time_of_day')}
                            onChange={(e) =>
                              setBoxConditions((prev) => ({
                                ...prev,
                                [box.id]: {
                                  ...prev[box.id],
                                  [condition.id]: {
                                    ...prev[box.id][condition.id],
                                    time_of_day: e.target.value,
                                  },
                                },
                              }))
                            }
                          >
                            <option value="morning">{t('morning')}</option>
                            <option value="noon">{t('noon')}</option>
                            <option value="evening">{t('evening')}</option>
                          </select>
                          <label htmlFor="interval_days">
                            {t('boxes.condition.interval_days')}
                          </label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            defaultValue={condition.interval_days}
                            title={t('boxes.condition.interval_days')}
                            aria-label={t('boxes.condition.interval_days')}
                            min={0}
                            step={1}
                            onChange={(e) =>
                              setBoxConditions((prev) => ({
                                ...prev,
                                [box.id]: {
                                  ...prev[box.id],
                                  [condition.id]: {
                                    ...prev[box.id][condition.id],
                                    interval_days: e.target.value,
                                  },
                                },
                              }))
                            }
                          />
                          <label htmlFor="start_date">{t('boxes.condition.start_date')}</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            title={t('boxes.condition.start_date')}
                            aria-label={t('boxes.condition.start_date')}
                            defaultValue={
                              condition.start_date
                                ? new Date(condition.start_date)
                                    .toISOString()
                                    .split('T')[0]
                                : ''
                            }
                            onChange={(e) =>
                              setBoxConditions((prev) => ({
                                ...prev,
                                [box.id]: {
                                  ...prev[box.id],
                                  [condition.id]: {
                                    ...prev[box.id][condition.id],
                                    start_date: e.target.value,
                                  },
                                },
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm mt-2"
                            onClick={() =>
                              setBoxConditions((prev) => ({
                                ...prev,
                                [box.id]: {
                                  ...prev[box.id],
                                  [condition.id]: undefined,
                                },
                              }))
                            }
                            title={t('boxes.condition.delete')}
                            aria-label={t('boxes.condition.delete')}
                          >
                            <i className="bi bi-trash"></i> {t('boxes.condition.delete')}
                          </button>
                        </div>
                      </div>
                    ))}

                  <button
                    type="button"
                    className="btn btn-outline-dark w-100"
                    onClick={() => {
                      const id = uuidv4();
                      setBoxConditions((prev) => ({
                        ...prev,
                        [box.id]: {
                          ...prev[box.id],
                          [id]: {
                            id,
                            tablet_count: 1,
                            interval_days: 1,
                            start_date: null,
                            time_of_day: 'morning',
                          },
                        },
                      }));
                      setSelectedModifyBox(box.id);
                    }}
                  >
                  <i className="bi bi-plus-lg me-2"></i>
                  {t('boxes.condition.add')}
                  </button>
                </>
              ) : Object.values(box.conditions).filter(
                  (condition) => condition !== undefined
                ).length > 0 ? (
                Object.values(box.conditions)
                  .filter((condition) => condition !== undefined)
                  .map((condition) => (
                    <div
                      className="mb-2 p-3 border rounded bg-light"
                      key={condition.id}
                    >
                      <strong>
                        {condition.tablet_count}{' '}
                        {condition.tablet_count > 1 ? t('boxes.tablets') : t('boxes.tablet')}
                      </strong>{' '}
                      {t('boxes.every')} {' '}
                      <strong>
                        {condition.interval_days}{' '}
                        {condition.interval_days > 1 ? t('boxes.days') : t('boxes.day')}
                      </strong>{' '}
                      {t('boxes.each')} {' '}
                      <strong>{timeOfDayMap[condition.time_of_day]}</strong>
                      <br />
                      {condition.interval_days > 1 && (
                        <small className="text-muted">
                          {t('boxes.from')} {' '}
                          {new Date(condition.start_date).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  ))
              ) : (
                <div className="border rounded bg-light d-flex justify-content-start align-items-center p-2 mb-2">
                  <p className="text-muted mb-0">{t('boxes.condition.none')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedModifyBox && selectedModifyBox === box.id && (
          <>
            <hr />
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-success btn-sm"
                aria-label={t('boxes.save')}
                title={t('boxes.save')}
              >
                <i className="bi bi-save"></i> {t('boxes.save')}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedModifyBox(null);
                  setModifyBoxName({ ...modifyBoxName, [box.id]: box.name });
                  setModifyBoxCapacity({
                    ...modifyBoxCapacity,
                    [box.id]: box.box_capacity,
                  });
                  setModifyBoxStockAlertThreshold({
                    ...modifyBoxStockAlertThreshold,
                    [box.id]: box.stock_alert_threshold,
                  });
                  setModifyBoxStockQuantity({
                    ...modifyBoxStockQuantity,
                    [box.id]: box.stock_quantity,
                  });
                  setBoxConditions({
                    ...boxConditions,
                    [box.id]: box.conditions.reduce(
                      (acc, condition) => ({
                        ...acc,
                        [condition.id]: condition,
                      }),
                      {}
                    ),
                  });
                  setDose({ ...dose, [box.id]: box.dose });
                }}
                aria-label={t('boxes.cancel')}
                title={t('boxes.cancel')}
              >
                <i className="bi bi-x"></i> {t('boxes.cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BoxField({
  type,
  label,
  value,
  editable,
  onChange,
  onFocus = null,
  onBlur = null,
  onClick = null,
}) {
  return (
    <div className="w-50">
      <small className="text-muted">{label}</small>
      <br />
      {editable ? (
        <input
          type={type}
          aria-label={label}
          className="form-control form-control-sm w-75"
          defaultValue={value}
          value={value}
          onChange={onChange}
          required
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onClick}
        />
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

function StockBadge({ box }) {
  const { t } = useTranslation();
  if (box.box_capacity === 0) return null;

  if (box.stock_quantity <= 0) {
    return (
      <span className="badge bg-danger">
        <i className="bi bi-exclamation-triangle" /> {t('boxes.stock.badge.out')}
      </span>
    );
  }

  if (box.stock_quantity <= box.stock_alert_threshold) {
    return (
      <span className="badge bg-warning">
        <i className="bi bi-exclamation-triangle" /> {t('boxes.stock.badge.low')}
      </span>
    );
  }

  return (
    <span className="badge bg-success">
      <i className="bi bi-check-circle" /> {t('boxes.stock.badge.high')}
    </span>
  );
}

function InputDropdown({
  name,
  dose,
  onChangeName,
  onChangeDose,
  onChangeBoxCapacity,
  onChangeStockQuantity,
  fetchSuggestions,
}) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef();

  const handleSelect = (item) => {
    const onlyNumbers = parseInt(item.dose.replace(/\D/g, ''));
    onChangeName(item.name);
    onChangeDose(onlyNumbers);
    onChangeBoxCapacity(item.conditionnement);
    onChangeStockQuantity(item.conditionnement);
    setShowDropdown(false);
    setSuggestions([]);
    inputRef.current.value = item.name;
  };

  useEffect(() => {
    if (!name || name.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const fetchData = async () => {
      const results = await fetchSuggestions(name, dose);
      setSuggestions(results);
    };

    const timeout = setTimeout(fetchData, 300); // anti-spam
    return () => clearTimeout(timeout);
  }, [name, dose]);

  return (
    <div className="position-relative w-100 d-flex gap-2">
      <div className="w-50">
        <small className="text-muted">{t('boxes.name')}</small>
        <br />
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-sm"
          defaultValue={name}
          onChange={(e) => {
            onChangeName(e.target.value);
          }}
          onClick={() => setTimeout(() => setShowDropdown(true), 300)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={t('boxes.start_typing')}
        />
      </div>
      <BoxField
        type="number"
        label={t('boxes.dose')}
        value={dose}
        editable={true}
        onChange={(e) => {
          onChangeDose(parseInt(e.target.value));
        }}
        onClick={() => setTimeout(() => setShowDropdown(true), 300)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul
          className="dropdown-menu show position-absolute top-100 start-0 w-100"
          style={{ maxHeight: 200, overflowY: 'auto' }}
        >
          {suggestions.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                className="dropdown-item text-wrap"
                onClick={() => handleSelect(item)}
              >
                {item.name} - {item.dose} - {item.conditionnement}{' '}
                {item.forme_pharmaceutique}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BoxesView;
