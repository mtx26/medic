import React from 'react';

export default function PrivacyPage() {
    return (
        <section class="container my-5">
            <h2>🔐 Politique de confidentialité – MediTime</h2>
            <p><strong>Dernière mise à jour : 9 juin 2025</strong></p>

            <h3>1. Qui sommes-nous ?</h3>
            <p><strong>MediTime</strong> est une application web destinée à faciliter la gestion des traitements médicamenteux. Elle permet de créer des calendriers personnalisés, de recevoir des rappels, et de partager les plannings avec des proches ou des professionnels de santé. Le projet est développé à titre personnel par Matis Gillet (alias <em>mtx_26</em>), sans but commercial.</p>

            <hr />

            <h3>2. Quelles données sont collectées ?</h3>

            <h4>✅ Données personnelles</h4>
            <ul>
                <li><strong>Email, nom, photo</strong> : via l’authentification (Supabase Auth).</li>
                <li><strong>Identifiant unique</strong> : généré automatiquement pour chaque utilisateur.</li>
            </ul>

            <h4>💊 Données liées aux traitements</h4>
            <ul>
                <li>Noms des médicaments, posologies, fréquences, heures de prise.</li>
                <li>Informations sur les boîtes (quantité, stock, conditionnements).</li>
                <li>Historique de modifications et de partages de calendriers.</li>
            </ul>

            <h4>📱 Données techniques</h4>
            <ul>
                <li>Jetons de notifications push (si activées).</li>
                <li>Informations sur l'appareil et le navigateur (pour le débogage et les statistiques anonymisées).</li>
            </ul>

            <hr />

            <h3>3. Comment sont utilisées ces données ?</h3>
            <ul>
                <li>Afficher et synchroniser les calendriers de traitement.</li>
                <li>Envoyer des rappels ou alertes si l’utilisateur a activé les notifications.</li>
                <li>Permettre le partage sécurisé avec d’autres utilisateurs.</li>
                <li>Améliorer la stabilité et la sécurité de l’application.</li>
            </ul>
            <p><strong>Aucune donnée n’est vendue, partagée ou utilisée à des fins publicitaires.</strong></p>

            <hr />

            <h3>4. Où sont stockées les données ?</h3>
            <ul>
                <li><strong>Supabase</strong> (PostgreSQL et authentification).</li>
                <li><strong>Firebase</strong> (uniquement pour les notifications push et les statistiques anonymes).</li>
            </ul>
            <p>Les bases de données sont localisées dans l’Union Européenne ou dans des zones conformes au RGPD.</p>

            <hr />

            <h3>5. Partage et sécurité</h3>
            <ul>
                <li><strong>Tous les partages de calendriers</strong> sont chiffrés et contrôlés par l’utilisateur.</li>
                <li>L’accès aux données est <strong>protégé par authentification</strong>.</li>
                <li>Les identifiants ne sont <strong>jamais visibles ni stockés en clair</strong>.</li>
            </ul>

            <hr />

            <h3>6. Vos droits</h3>
            <p>Conformément au RGPD, vous pouvez à tout moment :</p>
            <ul>
                <li>Consulter ou exporter vos données.</li>
                <li>Demander leur suppression définitive.</li>
                <li>Révoquer l’accès aux calendriers partagés.</li>
                <li>Désactiver les notifications.</li>
            </ul>
            <p>Pour exercer ces droits : <br />
                📧 <a href="mailto:mtx_26@outlook.be"><strong>mtx_26@outlook.be</strong></a>
            </p>

            <hr />

            <h3>7. Contact</h3>
            <p>
                Développeur responsable :<br />
                <strong>Matis Gillet</strong><br />
                📧 <a href="mailto:mtx_26@outlook.be">mtx_26@outlook.be</a><br />
                🌐 <a href="https://meditime-app.com" target="_blank">meditime-app.com</a><br />
                🐙 <a href="https://github.com/mtx26" target="_blank">GitHub – mtx26</a>
            </p>
        </section>
    );
}