const { onRequest } = require('firebase-functions/v2/https');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp();

exports.manualDatabaseUpdate = functions.https.onRequest(async (req, res) => {
  try {
    const eventsSnapshot = await admin
      .firestore()
      .collection('ActiveEvents')
      .get();
    const batch = admin.firestore().batch();

    eventsSnapshot.forEach((doc) => {
      if (doc.data().endDate.toDate() < new Date()) {
        const inactiveEventRef = admin
          .firestore()
          .collection('InactiveEvents')
          .doc(doc.id);
        batch.set(inactiveEventRef, doc.data());
        batch.delete(admin.firestore().collection('ActiveEvents').doc(doc.id));
      }
    });

    await batch.commit();
    res.status(200).send('Database updated successfully!');
  } catch (error) {
    console.error('Error updating database: ', error);
    res.status(500).send('Error updating the database');
  }
});
