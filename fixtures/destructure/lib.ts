export const {
  syncUserProfile,
  syncUserPreferences,
  syncUserName,
} = { syncUserProfile: 1, syncUserPreferences: 2, syncUserName: 3 };

export const [first, second] = [1, 2];

export const {
  nested: { deep },
} = { nested: { deep: 1 } };

function feed() {
  return { onlyFedToDeadBinding: 1 };
}

export const { onlyFedToDeadBinding } = feed();
