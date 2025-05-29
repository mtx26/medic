import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import useIsTouchDevice from "../hooks/useIsTouchDevice";
import PropTypes from 'prop-types';


export default function HoveredUserProfile({ user, trigger, containerRef = null }) {
  const [open, setOpen] = useState(false);
  
  const isTouchDevice = useIsTouchDevice();


  // gestion mobile : click toggle
  const handleClick = () => {
    if (isTouchDevice) setOpen((prev) => !prev);
  };

  // gestion desktop : hover in/out
  const handleMouseEnter = () => {
    if (!isTouchDevice) setOpen(true);
  };
  const handleMouseLeave = () => {
    if (!isTouchDevice) setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <span
          type="button"
          tabIndex={0}
          onClick={handleClick}
          onPointerEnter={handleMouseEnter}
          onPointerLeave={handleMouseLeave}
        >
          <span 
            style={{
              cursor: "pointer",
              textDecoration: open ? "underline" : "none",
              color: open ? "#0d6efd" : "inherit",
              transition: "color 0.2s, text-decoration 0.2s"
            }}
            className="d-flex align-items-center gap-1"
          >
            {trigger} <i className="bi bi-info-circle" style={{ fontSize: "0.9em", color: "#6c757d" }}></i>
          </span>
        </span>
      </Popover.Trigger>

      <Popover.Portal container={containerRef?.current}>
        <Popover.Content
          sideOffset={8}
          align="center"
          className="shadow-lg rounded-3 bg-white border p-3"
          style={{
            width: 250,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onClick={handleClick}
          onPointerEnter={handleMouseEnter}
          onPointerLeave={handleMouseLeave}
        >
          <div className="d-flex flex-column align-items-center text-center gap-2">
            <img
              src={user.photo_url}
              alt="Profil"
              className="rounded-circle"
              style={{ width: "70px", height: "70px", objectFit: "cover" }}
            />
            <div>
              <h6 className="mb-0">{user.display_name}</h6>
              <small className="text-muted">{user.email}</small>
            </div>
          </div>
          <Popover.Arrow className="text-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

HoveredUserProfile.propTypes = {
  user: PropTypes.shape({
    photo_url: PropTypes.string.isRequired,
    display_name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
  trigger: PropTypes.node.isRequired,
  containerRef: PropTypes.object,
};
