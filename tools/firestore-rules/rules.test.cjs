const { readFileSync } = require('node:fs');
const { test, before, after, beforeEach } = require('node:test');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction } = require('firebase/firestore');
let env;
const publicPath = 'Users/Active/Public/alice';
const privatePath = 'Users/Active/Private/alice';
const db = () => env.authenticatedContext('alice').firestore();
async function seed(data) {
  await env.withSecurityRulesDisabled(async context => {
    for (const [path, value] of Object.entries(data)) await setDoc(doc(context.firestore(), path), value);
  });
}
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-sportshub-rules', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
beforeEach(async () => env.clearFirestore());
after(async () => env?.cleanup());

test('new profile and username are created atomically', async () => {
  const client = db();
  await assertSucceeds(runTransaction(client, async tx => {
    await tx.get(doc(client, publicPath));
    await tx.get(doc(client, privatePath));
    await tx.get(doc(client, 'Usernames/alice'));
    tx.set(doc(client, 'Usernames/alice'), { userId: 'alice' });
    tx.set(doc(client, publicPath), { username: 'alice', firstName: 'Alice' });
    tx.set(doc(client, privatePath), { onboardingCompletedAt: null });
  }));
});
test('verified email promotion deletes TempUsers in the same commit', async () => {
  await seed({ 'TempUsers/alice': { firstName: 'Alice' } });
  const client = db();
  const batch = writeBatch(client);
  batch.set(doc(client, publicPath), { username: 'alice' });
  batch.set(doc(client, privatePath), { onboardingCompletedAt: null });
  batch.set(doc(client, 'Usernames/alice'), { userId: 'alice' });
  batch.delete(doc(client, 'TempUsers/alice'));
  await assertSucceeds(batch.commit());
});
test('existing accounts without mappings can read profiles, edit details and sync email', async () => {
  await seed({ [publicPath]: { username: 'legacy', firstName: 'Alice' }, [privatePath]: { email: 'old' } });
  const client = db();
  await assertSucceeds(getDoc(doc(client, publicPath)));
  await assertSucceeds(getDoc(doc(client, privatePath)));
  await assertSucceeds(updateDoc(doc(client, publicPath), { firstName: 'Updated' }));
  await assertSucceeds(updateDoc(doc(client, privatePath), { email: 'new', onboardingPersona: 'organiser' }));
});
test('partial legacy profile can acquire missing private data without changing public data', async () => {
  await seed({ [publicPath]: { username: 'legacy', firstName: 'Preserved' } });
  await assertSucceeds(setDoc(doc(db(), privatePath), { onboardingCompletedAt: null }));
});
test('missing public profile can reuse an existing owned username mapping', async () => {
  await seed({ 'Usernames/alice': { userId: 'alice' }, [privatePath]: { email: 'existing' } });
  await assertSucceeds(setDoc(doc(db(), publicPath), { username: 'alice' }));
});
test('rename and delete preserve mapping consistency', async () => {
  await seed({ [publicPath]: { username: 'alice' }, [privatePath]: {}, 'Usernames/alice': { userId: 'alice' } });
  const client = db();
  await assertFails(updateDoc(doc(client, publicPath), { username: 'newname' }));
  await assertFails(deleteDoc(doc(client, 'Usernames/alice')));
  const rename = writeBatch(client);
  rename.update(doc(client, publicPath), { username: 'newname' });
  rename.set(doc(client, 'Usernames/newname'), { userId: 'alice' });
  rename.delete(doc(client, 'Usernames/alice'));
  await assertSucceeds(rename.commit());
  const remove = writeBatch(client);
  remove.delete(doc(client, publicPath));
  remove.delete(doc(client, privatePath));
  remove.delete(doc(client, 'Usernames/newname'));
  await assertSucceeds(remove.commit());
});
test('legacy mapping-first creation and sequential deletion are incompatible', async () => {
  await assertFails(setDoc(doc(db(), 'Usernames/alice'), { userId: 'alice' }));
  await seed({ [publicPath]: { username: 'alice' }, 'Usernames/alice': { userId: 'alice' } });
  await assertFails(deleteDoc(doc(db(), publicPath)));
});
test('public username lookup is allowed but enumeration and takeover are denied', async () => {
  await seed({ 'Usernames/taken': { userId: 'bob' } });
  const client = db();
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'Usernames/taken')));
  await assertFails(getDocs(collection(client, 'Usernames')));
  await assertFails(setDoc(doc(client, 'Usernames/taken'), { userId: 'alice' }));
  await assertFails(deleteDoc(doc(client, 'Usernames/taken')));
  await assertFails(setDoc(doc(client, publicPath), { username: 'taken' }));
});
test('cross-account profile and temporary-user writes are denied', async () => {
  const client = db();
  for (const path of ['Users/Active/Public/bob', 'Users/Active/Private/bob', 'TempUsers/bob']) {
    await assertFails(setDoc(doc(client, path), { username: 'alice' }));
  }
  await assertSucceeds(setDoc(doc(client, 'TempUsers/alice'), { firstName: 'Alice' }));
  await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), 'TempUsers/alice')));
});
test('legacy rename must omit deletion of a nonexistent old mapping', async () => {
  await seed({ [publicPath]: { username: 'legacy' } });
  const client = db();
  const oldClient = writeBatch(client);
  oldClient.update(doc(client, publicPath), { username: 'newname' });
  oldClient.set(doc(client, 'Usernames/newname'), { userId: 'alice' });
  oldClient.delete(doc(client, 'Usernames/legacy'));
  await assertFails(oldClient.commit());
  const repairedClient = writeBatch(client);
  repairedClient.update(doc(client, publicPath), { username: 'newname' });
  repairedClient.set(doc(client, 'Usernames/newname'), { userId: 'alice' });
  await assertSucceeds(repairedClient.commit());
});
