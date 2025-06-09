import React, { useContext, useState, useEffect } from 'react';
import { UserContext, getGlobalReloadUser } from '../../contexts/UserContext';
import { supabase } from '../../services/supabaseClient';
import { log } from '../../utils/logger';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const API_URL = import.meta.env.VITE_API_URL;

const Account = ({ sharedProps }) => {
  const { userInfo } = useContext(UserContext);
  const reloadUser = getGlobalReloadUser();

  const [displayName, setDisplayName] = useState(userInfo?.displayName || '');
  const [showOverlay, setShowOverlay] = useState(false);
  const [previewURL, setPreviewURL] = useState(
    userInfo?.photoURL ||
      'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'
  );
  const [photoFile, setPhotoFile] = useState(null);
  const [isModified, setIsModified] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [rawImage, setRawImage] = useState(null);

  useEffect(() => {
    if (displayName !== userInfo?.displayName) {
      setIsModified(true);
    }
  }, [displayName, userInfo?.displayName]);

  const uploadPhoto = async (file) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const formData = new FormData();
    formData.append('photo', file);
    const response = await fetch(`${API_URL}/api/user/photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });
    const data = await response.json();
    log.info(data.message, {
      origin: 'PHOTO_UPLOAD_SUCCESS',
      uid: userInfo.uid,
    });
  };

  const handleCropConfirm = async () => {
    const croppedImage = await getCroppedImg(rawImage, croppedAreaPixels);
    setPreviewURL(croppedImage);
    setPhotoFile(await fetch(croppedImage).then((r) => r.blob()));
    setShowCropModal(false);
    setIsModified(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photoFile) {
      await uploadPhoto(photoFile);
    }
    reloadUser(displayName);
    setIsModified(false);
    setPhotoFile(null);
  };

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const imageURL = URL.createObjectURL(file);
        setRawImage(imageURL);
        setShowCropModal(true); // ouvre l’éditeur
      }
    };
    input.click();
  };

  useEffect(() => {
    return () => {
      if (previewURL?.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  return (
    <>
      <div>
        <h2 className="mb-3">Mon compte</h2>
        <p className="text-muted mb-4">
          Vous pouvez modifier vos informations personnelles ici.
        </p>

        <form className="row gap-3 align-items-center" onSubmit={handleSubmit}>
          <button
            className="position-relative d-inline-block rounded-circle overflow-hidden m-0 p-0 border-0"
            style={{ width: '100px', height: '100px', cursor: 'pointer' }}
            type="button"
            onClick={() => {
              setShowOverlay(!showOverlay);
              if (showOverlay) {
                openFilePicker();
              }
            }}
            onMouseEnter={() => setShowOverlay(true)}
            onMouseLeave={() => setShowOverlay(false)}
            onBlur={() => setShowOverlay(false)}
          >
            <img
              src={previewURL}
              alt="Profil"
              className="w-100 h-100 rounded-circle"
              style={{ objectFit: 'cover' }}
            />

            {showOverlay && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75">
                <i className="bi bi-pencil text-white fs-3"></i>
              </div>
            )}
          </button>

          <div className="col">
            <label htmlFor="displayName" className="form-label">
              Pseudo
            </label>
            <input
              type="text"
              id="displayName"
              className="form-control"
              placeholder="Entrez votre pseudo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          {isModified && (
            <div className="d-flex gap-2 justify-content-end">
              <button type="submit" className="btn btn-outline-primary">
                <i className="bi bi-check-lg"></i> Enregistrer les modifications
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => {
                  setDisplayName(userInfo?.displayName);
                  setPreviewURL(userInfo?.photoURL);
                  setIsModified(false);
                }}
              >
                <i className="bi bi-x-lg"></i> Annuler
              </button>
            </div>
          )}
        </form>
      </div>
      {showCropModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-white">
              <div className="modal-header">
                <h5 className="modal-title">Recadrer la photo</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCropModal(false)}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{ height: '400px', position: 'relative' }}
              >
                <Cropper
                  image={rawImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) =>
                    setCroppedAreaPixels(croppedPixels)
                  }
                />
              </div>
              <div className="modal-footer">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(e.target.value)}
                  className="form-range w-50"
                />
                <button className="btn btn-primary" onClick={handleCropConfirm}>
                  Utiliser cette image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Account;
