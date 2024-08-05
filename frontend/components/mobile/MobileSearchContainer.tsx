import { useState } from "react";
import MobileSearchBar from "./MobileSearchBar";
import MobileSearchDialog from "./MobileSearchDialog";
import MobileSearchInput from "./MobileSearchInput";

export default function SearchContainer() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openSearchInput = () => setIsDialogOpen(true);
  const closeSearchInput = () => setIsDialogOpen(false);

  return (
    <div>
      <MobileSearchBar openSearchInput={openSearchInput} />
      {isDialogOpen && (
        <MobileSearchDialog isOpen={isDialogOpen} onClose={closeSearchInput}>
          <MobileSearchInput
                      searchExpanded={isDialogOpen}
                      setSearchExpanded={closeSearchInput} tags={[]}          />
        </MobileSearchDialog>
      )}
    </div>
  );
}
