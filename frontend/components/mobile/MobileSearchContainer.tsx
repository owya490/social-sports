import { useEffect, useState } from "react";
import MobileSearchBar from "./MobileSearchBar";
import MobileSearchDialog from "./MobileSearchDialog";
import MobileSearchInput from "./MobileSearchInput";
import { Tag } from "@/interfaces/TagTypes";
import { getAllTags } from "@/services/src/tagService";

export default function MobileSearchContainer() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]); // Initialize state for tags

  // Fetch tags when the component mounts
  useEffect(() => {
    getAllTags().then((fetchedTags) => {
      setTags(fetchedTags);
    });
  }, []);

  const openSearchInput = () => setIsDialogOpen(true);
  const closeSearchInput = () => setIsDialogOpen(false);

  return (
    <div>
      <MobileSearchBar openSearchInput={openSearchInput} />
      <MobileSearchDialog isOpen={isDialogOpen} onClose={closeSearchInput}>
        <MobileSearchInput
          setSearchExpanded={closeSearchInput} // Only passing required props
          tags={tags} // Pass the fetched tags to the MobileSearchInput
        />
      </MobileSearchDialog>
    </div>
  );
}
