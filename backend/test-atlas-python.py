#!/usr/bin/env python3
"""Test de connexion directe à MongoDB Atlas"""

try:
    from pymongo import MongoClient
    from datetime import datetime
    
    print("=" * 50)
    print("TEST CONNEXION DIRECTE MONGODB ATLAS")
    print("=" * 50)
    print()
    
    uri = "mongodb+srv://devgroupentreprise_db_user:devgroupentreprise_db_user@cluster-dga-1.xylzvke.mongodb.net/"
    print(f"URI: {uri}")
    print()
    
    print("Connexion en cours...")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    
    # Test de connexion
    client.admin.command('ping')
    print("✓ Connexion réussie!")
    print()
    
    # Liste des bases
    print("Bases de données existantes:")
    for db_name in client.list_database_names():
        print(f"  - {db_name}")
    print()
    
    # Test d'écriture
    print("Test d'écriture dans mbolo_test...")
    db = client.mbolo_test
    result = db.test_collection.insert_one({
        "test": "connexion réussie",
        "date": datetime.now(),
        "from": "Python test script"
    })
    print(f"✓ Document inséré avec ID: {result.inserted_id}")
    print()
    
    # Vérification
    doc = db.test_collection.find_one({"_id": result.inserted_id})
    print(f"✓ Document récupéré: {doc}")
    print()
    
    print("=" * 50)
    print("TOUS LES TESTS PASSÉS!")
    print("=" * 50)
    print()
    print("Vous pouvez maintenant:")
    print("1. Rafraîchir MongoDB Compass")
    print("2. Voir la base 'mbolo_test' avec la collection 'test_collection'")
    print("3. Reconstruire les services Docker: .\\rebuild-services.bat")
    print()
    
    client.close()
    
except ImportError:
    print("❌ ERREUR: pymongo n'est pas installé")
    print()
    print("Installation:")
    print("  pip install pymongo")
    print()
    
except Exception as e:
    print(f"❌ ERREUR: {e}")
    print()
    print("Vérifications:")
    print("1. Le mot de passe est-il correct?")
    print("2. Votre IP est-elle autorisée dans Atlas Network Access?")
    print("   https://cloud.mongodb.com/v2#/security/network/accessList")
    print("3. L'utilisateur existe-t-il dans Database Access?")
    print("   https://cloud.mongodb.com/v2#/security/database/users")
    print()

input("Appuyez sur Entrée pour continuer...")
