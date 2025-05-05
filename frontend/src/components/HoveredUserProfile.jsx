import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";

export default function HoveredUserProfile({ user, trigger }) {
  const [open, setOpen] = useState(false);

  // gestion mobile : click toggle
  const handleClick = () => {
    if (window.innerWidth <= 768) setOpen((prev) => !prev);
  };

  // gestion desktop : hover in/out
  const handleMouseEnter = () => {
    if (window.innerWidth > 768) setOpen(true);
  };
  const handleMouseLeave = () => {
    if (window.innerWidth > 768) setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <span
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span style={{ cursor: "pointer" }}>{trigger}</span>
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="center"
          className="shadow-lg rounded-3 bg-white border p-3"
          style={{
            width: 250,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
