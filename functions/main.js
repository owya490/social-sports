const { onRequest } = require('firebase-functions/v2/https');

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('firebase-functions/logger/compat');
admin.initializeApp();

exports.manualDatabaseUpdate = functions.https.onRequest(async (req, res) => {
  try {
    const eventsSnapshot = await admin
      .collection('Events')
      .doc('Active')
      .collection('Public')
      .get();
    const batch = admin.firestore().batch();
    console.log(eventsSnapshot);
    eventsSnapshot.forEach((doc) => {
      if (doc.data().endDate.toDate() < new Date()) {
        console.log(doc.data());
        const inactiveEventRef = admin
          .firestore()
          .collection('Events')
          .doc('InActive')
          .collection('Public')
          .doc(doc.id);
        batch.set(inactiveEventRef, doc.data());
        batch.delete(
          admin
            .firestore()
            .collection('Events')
            .doc('Active')
            .collection('Public')
            .doc(doc.id)
        );
      }
    });

    await batch.commit();
    res.status(200).send('Database updated successfully!');
  } catch (error) {
    console.error('Error updating database: ', error);
    res.status(500).send('Error updating the database');
  }
});
